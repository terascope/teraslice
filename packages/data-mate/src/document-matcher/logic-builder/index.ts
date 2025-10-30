import { xLuceneFieldType, xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import * as p from 'xlucene-parser';
import {
    isWildCardString, get, isEqual, isArray,
    and, isGreaterThanFP, isGreaterThanOrEqualToFP,
    isLessThanOrEqualToFP, isLessThanFP,
} from '@terascope/core-utils';
import { compareTermDates, dateRange } from './dates.js';
import { regexp, wildcard, findWildcardField } from './string.js';
import { BooleanCB } from '../interfaces.js';
import { ipTerm, ipRange } from '../../ip-utils.js';

export default function buildLogicFn(
    parser: p.Parser,
    variables: xLuceneVariables = {}
): BooleanCB {
    return walkAst(parser.ast, parser.typeConfig, variables);
}

function makeGetFn(field?: string): (data: any) => unknown {
    if (!field) return (obj) => Object.values(obj);
    if (field.includes('.')) return (obj) => get(obj, field);

    return function getProp(obj) {
        if (isArray(obj)) {
            return obj.map((el) => el[field]).filter((el) => el !== undefined);
        }
        return obj[field];
    };
}

function logicNode(field: string | undefined, cb: BooleanCB): BooleanCB {
    if (field && isWildCardString(field)) {
        return findWildcardField(field, cb);
    }
    const getFn = makeGetFn(field);
    const getAnyData = makeSomeFn(cb);

    return function _logicNode(obj) {
        const data = getFn(obj);

        if (Array.isArray(data)) {
            return getAnyData(data);
        }
        return cb(data);
    };
}

function makeSomeFn(cb: BooleanCB) {
    return function someFn(data: any[]) {
        return data.some(cb);
    };
}

function makeNegate(fn: any) {
    return function negate(data: any) {
        return !fn(data);
    };
}

const rangeMapping = {
    gte: isGreaterThanOrEqualToFP,
    gt: isGreaterThanFP,
    lte: isLessThanOrEqualToFP,
    lt: isLessThanFP
} as const;

function rangeFn(node: p.Range, variables: xLuceneVariables): BooleanCB {
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

function valueExists(value: any): boolean {
    return value != null;
}

function isFalse(): boolean {
    return false;
}

function walkAst(
    node: p.Node,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
): BooleanCB {
    if (p.isEmptyNode(node)) {
        return isFalse;
    }

    if (p.isNegation(node)) {
        const childLogic = walkAst(node.node, typeConfig, variables);
        return makeNegate(childLogic);
    }

    if (p.isGroupLike(node)) {
        return makeGroupFn(node, typeConfig, variables);
    }

    const value = getAnyValue(node, variables);
    const field = p.getField(node);

    if (p.isTerm(node)) {
        return logicNode(field, typeFunctions(
            node, typeConfig, variables, makeIsValue(value)
        ));
    }

    if (p.isRange(node)) {
        return logicNode(field, typeFunctions(
            node, typeConfig, variables, rangeFn(node, variables)
        ));
    }

    if (p.isFunctionNode(node)) {
        const instance = p.initFunction({ node, variables, type_config: typeConfig });
        return logicNode(field, instance.match);
    }

    if (p.isExists(node)) {
        return logicNode(field, valueExists);
    }

    if (p.isRegexp(node)) {
        return logicNode(field, regexp(value));
    }

    if (p.isWildcard(node)) {
        return logicNode(field, wildcard(value));
    }

    // nothing was found so return a fn that returns false
    return isFalse;
}

function getAnyValue(
    node: unknown, variables: xLuceneVariables
): any {
    if (!node) return undefined as any;
    if (typeof (node as any).value === 'object') {
        return p.getFieldValue((node as any).value, variables);
    }
    return (node as any).value;
}

function typeFunctions(
    node: p.Term | p.Range,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
    defaultCb: BooleanCB
): BooleanCB {
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
            return ipRange(rangeQuery);
        }

        const value = p.getFieldValue(node.value, variables);
        if (value === undefined) {
            return () => false;
        }

        return ipTerm(value);
    }

    if (type === xLuceneFieldType.Boolean) {
        if (p.isRange(node)) {
            throw new Error('Unexpected range query on field type boolean');
        }
    }

    return defaultCb;
}

function makeIsValue(value: any) {
    if (value === undefined) return () => false;

    return function isValue(data: any) {
        if (typeof value === 'bigint' && typeof data === 'number') {
            return value === BigInt(data);
        }
        if (typeof value === 'number' && typeof data === 'bigint') {
            return BigInt(value) === data;
        }
        return isEqual(data, value);
    };
}

function makeConjunctionFn(
    conjunction: p.Conjunction,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables
): BooleanCB {
    const fns = conjunction.nodes.map((node) => walkAst(node, typeConfig, variables));
    return makeAllPassFn(fns);
}

function makeGroupFn(
    node: p.GroupLikeNode,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
): BooleanCB {
    const fns = node.flow.map((conjunction) => makeConjunctionFn(
        conjunction, typeConfig, variables
    ));
    return makeAnyPassFn(fns);
}

function makeAnyPassFn(fns: BooleanCB[]): BooleanCB {
    const len = fns.length;
    return function anyPassFn(data: any) {
        for (let i = 0; i < len; i++) {
            if (fns[i](data)) return true;
        }
        return false;
    };
}

function makeAllPassFn(fns: BooleanCB[]): BooleanCB {
    const len = fns.length;

    return function allPassFn(data: any) {
        for (let i = 0; i < len; i++) {
            if (!fns[i](data)) return false;
        }
        return true;
    };
}
