import { xLuceneFieldType, xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import * as p from 'xlucene-parser';
import { isWildCardString, get } from '@terascope/utils';
import { geoDistance, geoBoundingBox } from './geo';
import { compareTermDates, dateRange } from './dates';
import {
    regexp, wildcard, findWildcardField
} from './string';
import { BooleanCB } from '../interfaces';
import { ipTerm, ipRange } from './ip';

export default function buildLogicFn(
    parser: p.Parser,
    typeConfig: xLuceneTypeConfig = {},
    variables: xLuceneVariables = {}
): BooleanCB {
    return walkAst(parser.ast, typeConfig, variables);
}

function makeGetFn(field?: string) {
    if (!field) return (obj: any) => Object.values(obj);
    if (field.includes('.')) return (obj: any) => get(obj, field);

    return function getProp(obj: any) {
        return obj[field];
    };
}

function logicNode(field: string|undefined, cb: BooleanCB) {
    if (field && isWildCardString(field)) {
        return findWildcardField(field, cb);
    }
    const getFn = makeGetFn(field);
    const getAnyData = makeSomeFn(cb);

    return function _logicNode(obj: any) {
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

function rangeFn(node: p.Range): BooleanCB {
    const { left, right } = node;

    if (!right) {
        return function singleRangeTerm(data: any) {
            return rangeMapping[left.operator](data, left.value);
        };
    }

    return function doubleRangeTerm(data: any) {
        return rangeMapping[left.operator](data, left.value)
            && rangeMapping[right.operator](data, right.value);
    };
}

function valueExists(value: any) {
    return value != null;
}

function isFalse() {
    return false;
}

function walkAst(
    node: p.AnyAST,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
): BooleanCB {
    if (p.isEmptyAST(node)) {
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
            node, typeConfig, variables, rangeFn(node)
        ));
    }

    if (p.isFunctionNode(node)) {
        const instance = p.initFunction({ node, variables, type_config: typeConfig });
        return logicNode(field, instance.match);
    }

    if (p.isGeoDistance(node)) {
        return logicNode(field, geoDistance(node));
    }

    if (p.isGeoBoundingBox(node)) {
        return logicNode(field, geoBoundingBox(node));
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
) {
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
        return data === value;
    };
}

function makeConjunctionFn(
    conjunction: p.Conjunction,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables
) {
    const fns = conjunction.nodes.map((node) => walkAst(node, typeConfig, variables));
    return makeAllPassFn(fns);
}

function makeGroupFn(
    node: p.GroupLikeAST,
    typeConfig: xLuceneTypeConfig,
    variables: xLuceneVariables,
) {
    const fns = node.flow.map((conjunction) => makeConjunctionFn(
        conjunction, typeConfig, variables
    ));
    return makeAnyPassFn(fns);
}

function makeAnyPassFn(fns: BooleanCB[]) {
    const len = fns.length;
    return function anyPassFn(data: any) {
        for (let i = 0; i < len; i++) {
            if (fns[i](data)) return true;
        }
        return false;
    };
}

function makeAllPassFn(fns: BooleanCB[]) {
    const len = fns.length;

    return function allPassFn(data: any) {
        for (let i = 0; i < len; i++) {
            if (!fns[i](data)) return false;
        }
        return true;
    };
}
