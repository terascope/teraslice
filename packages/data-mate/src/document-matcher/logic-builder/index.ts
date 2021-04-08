import { xLuceneFieldType, xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import * as p from 'xlucene-parser';
import { isWildCardString, get } from '@terascope/utils';
import { compareTermDates, dateRange } from './dates';
import {
    regexp, wildcard, findWildcardField
} from './string';
import { BooleanCB } from '../interfaces';
import { ipTerm, ipRange } from './ip';

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
        return obj[field];
    };
}

function logicNode(field: string|undefined, cb: BooleanCB): BooleanCB {
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
    gte(value: any, other: any) {
        return value >= other;
    },
    gt(value: any, other: any) {
        return value > other;
    },
    lte(value: any, other: any) {
        return value <= other;
    },
    lt(value: any, other: any) {
        return value < other;
    }
};

function rangeFn(node: p.Range, variables: xLuceneVariables): BooleanCB {
    const { left, right } = node;

    if (!right) {
        const value = p.getFieldValue(left.value, variables);
        return function singleRangeTerm(data: any) {
            return rangeMapping[left.operator](data, value);
        };
    }

    const leftValue = p.getFieldValue(left.value, variables);
    const rightValue = p.getFieldValue(right.value, variables);
    return function doubleRangeTerm(data: any) {
        return rangeMapping[left.operator](data, leftValue)
            && rangeMapping[right.operator](data, rightValue);
    };
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
    node: p.Term|p.Range,
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

    return defaultCb;
}

function makeIsValue(value: any) {
    return function isValue(data: any) {
        if (typeof value === 'bigint' && typeof data === 'number') {
            return value === BigInt(data);
        }
        if (typeof value === 'number' && typeof data === 'bigint') {
            return BigInt(value) === data;
        }
        return data === value;
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
