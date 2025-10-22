import { xLuceneFieldType, xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import {
    and, isEqual, isNotNil, isWildCardString, not, or,
    isGreaterThanFP, isGreaterThanOrEqualToFP,
    isLessThanOrEqualToFP, isLessThanFP, toBigIntOrThrow
} from '@terascope/core-utils';
import { inspect } from 'node:util';
import * as p from 'xlucene-parser';
import type { DataFrame } from '../DataFrame.js';
import { compareTermDates, dateRange } from './date-utils.js';
import { MatchRowFn } from './interfaces.js';
import { MatchValueFn } from '../../interfaces.js';
import { ipRangeOrThrow, ipTermOrThrow } from '../../ip-utils.js';
import { findWildcardFields, regexp, wildcard } from './wildcards-and-regex-utils.js';

/**
 * This builds a matcher for particular node,
 * when this is called it creates a curried function
 * that will conditionally call each function
*/
export function buildMatcherForNode(
    dataFrame: DataFrame<any>,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
) {
    return function _buildMatcherForNode(node: p.Node): MatchRowFn {
        if (p.isEmptyNode(node)) {
            return isFalse;
        }

        if (p.isNegation(node)) {
            return not(buildMatcherForNode(dataFrame, typeConfig, variables)(node.node));
        }

        if (p.isGroupLike(node)) {
            return makeGroupFn(dataFrame, typeConfig, variables)(node);
        }

        const field = p.getField(node);

        if (p.isRange(node)) {
            return matchFieldValue(dataFrame, field, typeFunctions(
                node, typeConfig, variables, makeRangeFn(node, variables)
            ));
        }

        if (p.isFunctionNode(node)) {
            const instance = p.initFunction({ node, variables, type_config: typeConfig });
            return matchFieldValue(dataFrame, field, instance.match);
        }

        if (p.isExists(node)) {
            return matchFieldValue(dataFrame, field, isNotNil);
        }

        if (p.isTermType(node)) {
            const value = getComparisonValue(node, variables);

            if (value === undefined) {
                return () => false;
            }

            if (p.isTerm(node)) {
                return matchFieldValue(dataFrame, field, typeFunctions(
                    node, typeConfig, variables, makeIsValue(value)
                ));
            }

            if (p.isRegexp(node)) {
                return matchFieldValue(dataFrame, field, regexp(value));
            }

            if (p.isWildcard(node)) {
                return matchFieldValue(dataFrame, field, wildcard(value));
            }
        }

        throw new Error(`Unsupported matcher for node: ${inspect(node)}`);
    };
}

/**
 * Get the value from the xLucene query
*/
function getComparisonValue(
    node: p.TermLikeNode, variables: xLuceneVariables
): unknown {
    if (!node) return undefined;

    if ('value' in node) {
        return p.getFieldValue((node as p.Term).value, variables);
    }

    throw new Error(`Unsupported value in node: ${inspect(node)}`);
}

function matchFieldValue(
    dataFrame: DataFrame<any>,
    field: string | undefined,
    cb: MatchValueFn
): MatchRowFn {
    const fields: string[] = [];
    if (!field) {
        fields.push(...Object.keys(dataFrame.config.fields));
    } else if (isWildCardString(field)) {
        fields.push(...findWildcardFields(field, Object.keys(dataFrame.config.fields)));
    } else {
        fields.push(field);
    }

    if (!fields.length) return isFalse;

    const getValue = makeGetValueFn(dataFrame, fields);

    return function _matchFieldValue(rowIndex) {
        const data = getValue(rowIndex);

        if (Array.isArray(data)) {
            return data.some(cb);
        }

        return cb(data);
    };
}

/**
 * This will create a function that gets a field value
 * and possible a nested field value
*/
function makeGetValueFn(
    dataFrame: DataFrame<Record<string, unknown>>,
    fields: string[]
): (rowIndex: number) => unknown {
    function getSingleValue(field: string, rowIndex: number) {
        let isBase = true;
        let value: unknown;
        for (const part of field.split('.')) {
            if (isBase) {
                value = dataFrame.getColumnOrThrow(part).vector.get(rowIndex, true);
                isBase = false;
            } else if (part in Object(value)) {
                // this will properly deal with arrays too (like example.0)
                value = (value as any)[part];
            } else {
                value = null;
                break;
            }
        }
        return value;
    }
    return function getValue(rowIndex) {
        if (fields.length === 1) return getSingleValue(fields[0], rowIndex);
        return fields.flatMap((f) => getSingleValue(f, rowIndex));
    };
}

function typeFunctions(
    node: p.Term | p.Range,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
    defaultCb: MatchValueFn
): MatchValueFn {
    if (node.field == null) return defaultCb;

    const type: xLuceneFieldType = typeConfig[node.field];
    if (type === xLuceneFieldType.Date) {
        if (p.isRange(node)) {
            const rangeQuery = p.parseRange(node, variables);
            return dateRange(rangeQuery);
        }

        const value = p.getFieldValue(node.value, variables);

        if (value === undefined) {
            return () => false;
        }

        return compareTermDates(value);
    }

    if (type === xLuceneFieldType.IP) {
        if (p.isRange(node)) {
            const rangeQuery = p.parseRange(node, variables);
            return ipRangeOrThrow(rangeQuery);
        }

        const value = p.getFieldValue(node.value, variables);

        if (value === undefined) {
            return () => false;
        }

        return ipTermOrThrow(value);
    }

    if (type === xLuceneFieldType.Boolean) {
        if (p.isRange(node)) {
            throw new Error('Unexpected range query on field type boolean');
        }
    }

    return defaultCb;
}

function makeIsValue(value: unknown) {
    return function isValue(data: unknown) {
        if (typeof value === 'bigint' && typeof data === 'number') {
            return value === toBigIntOrThrow(data);
        }
        if (typeof value === 'number' && typeof data === 'bigint') {
            return toBigIntOrThrow(value) === data;
        }
        if (data == null && value == null) return true;

        if (data == null && value == null) return true;
        return isEqual(data, value);
    };
}

function makeGroupFn(
    dataFrame: DataFrame<any>,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
) {
    const _makeConjunctionFn = makeConjunctionFn(dataFrame, typeConfig, variables);
    return function _makeGroupFn(node: p.GroupLikeNode) {
        return or(...node.flow.map(_makeConjunctionFn));
    };
}

function makeConjunctionFn(
    dataFrame: DataFrame<any>,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
) {
    const _buildMatcherForNode = buildMatcherForNode(dataFrame, typeConfig, variables);
    return function _makeConjunctionFn(conjunction: p.Conjunction) {
        return and(...conjunction.nodes.map(_buildMatcherForNode));
    };
}

const rangeMapping = {
    gte: isGreaterThanOrEqualToFP,
    gt: isGreaterThanFP,
    lte: isLessThanOrEqualToFP,
    lt: isLessThanFP
} as const;

function makeRangeFn(node: p.Range, variables: xLuceneVariables): MatchValueFn {
    const { left, right } = node;

    if (right == null) {
        const value = p.getFieldValue(left.value, variables);

        const leftFN = value === undefined
            ? () => false
            : rangeMapping[left.operator](value);

        return leftFN;
    }

    const leftValue = p.getFieldValue(left.value, variables);
    const rightValue = p.getFieldValue(right.value, variables);

    const leftFN = leftValue === undefined
        ? () => false
        : rangeMapping[left.operator](leftValue);

    const rightFN = leftValue === undefined
        ? () => false
        : rangeMapping[right.operator](rightValue);

    return and(
        leftFN,
        rightFN
    );
}

function isFalse(): boolean {
    return false;
}
