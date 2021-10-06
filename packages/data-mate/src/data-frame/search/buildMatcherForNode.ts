import { xLuceneFieldType, xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import {
    and, isEqual, isNotNil, isWildCardString, not, or,
    isGreaterThanFP, isGreaterThanOrEqualToFP,
    isLessThanOrEqualToFP, isLessThanFP, toBigIntOrThrow
} from '@terascope/utils';
import { inspect } from 'util';
import * as p from 'xlucene-parser';
import type { DataFrame } from '../DataFrame';
import { compareTermDates, dateRange } from './date-utils';
import { MatchRowFn, MatchValueFn } from './interfaces';
import { ipRange, ipTerm } from './ip-utils';
import { findWildcardField, regexp, wildcard } from './wildcards-and-regex-utils';

/**
 * This builds a matcher for particular node,
 * when this is called it creates a curried function
 * that will conditionally call each function
*/
export function buildMatcherForNode(
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
) {
    return function _buildMatcherForNode(node: p.Node): MatchRowFn {
        if (p.isEmptyNode(node)) {
            return isFalse;
        }

        if (p.isNegation(node)) {
            return not(buildMatcherForNode(typeConfig, variables)(node.node));
        }

        if (p.isGroupLike(node)) {
            return makeGroupFn(typeConfig, variables)(node);
        }

        const field = p.getField(node);

        if (p.isRange(node)) {
            return matchFieldValue(field, typeFunctions(
                node, typeConfig, variables, makeRangeFn(node, variables)
            ));
        }

        if (p.isFunctionNode(node)) {
            const instance = p.initFunction({ node, variables, type_config: typeConfig });
            return matchFieldValue(field, instance.match);
        }

        if (p.isExists(node)) {
            return matchFieldValue(field, isNotNil);
        }
        if (p.isTermType(node)) {
            const value = getComparisonValue(node, variables);

            if (p.isTerm(node)) {
                return matchFieldValue(field, typeFunctions(
                    node, typeConfig, variables, makeIsValue(value)
                ));
            }

            if (p.isRegexp(node)) {
                return matchFieldValue(field, regexp(value));
            }

            if (p.isWildcard(node)) {
                return matchFieldValue(field, wildcard(value));
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

function matchFieldValue(field: string|undefined, cb: MatchValueFn): MatchRowFn {
    if (!field) throw new Error('Searching all fields is not allowed at the moment');

    if (isWildCardString(field)) {
        return findWildcardField(field, cb);
    }

    const getValue = makeGetValueFn(field);

    return function _matchFieldValue(dataFrame, rowIndex) {
        const data = getValue(dataFrame, rowIndex);

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
function makeGetValueFn(field: string): (
    dataFrame: DataFrame<Record<string, unknown>>, rowIndex: number
) => unknown {
    return function getValue(dataFrame, rowIndex) {
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
            }
        }
        return value;
    };
}

function typeFunctions(
    node: p.Term|p.Range,
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
        return compareTermDates(value);
    }

    if (type === xLuceneFieldType.IP) {
        if (p.isRange(node)) {
            const rangeQuery = p.parseRange(node, variables);
            return ipRange(rangeQuery);
        }

        const value = p.getFieldValue(node.value, variables);
        return ipTerm(value);
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
        return isEqual(data, value);
    };
}

function makeGroupFn(
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
) {
    const _makeConjunctionFn = makeConjunctionFn(typeConfig, variables);
    return function _makeGroupFn(node: p.GroupLikeNode) {
        return or(...node.flow.map(_makeConjunctionFn));
    };
}

function makeConjunctionFn(
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
) {
    const _buildMatcherForNode = buildMatcherForNode(typeConfig, variables);
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
        return rangeMapping[left.operator](value);
    }

    const leftValue = p.getFieldValue(left.value, variables);
    const rightValue = p.getFieldValue(right.value, variables);
    return and(
        rangeMapping[left.operator](leftValue),
        rangeMapping[right.operator](rightValue)
    );
}

function isFalse(): boolean {
    return false;
}
