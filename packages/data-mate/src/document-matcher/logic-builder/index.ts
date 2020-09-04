import { xLuceneFieldType, xLuceneTypeConfig } from '@terascope/types';
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
    parser: p.Parser, typeConfig: xLuceneTypeConfig = {}
): BooleanCB {
    return walkAst(parser.ast, typeConfig);
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

function walkAst(node: p.AnyAST, typeConfig: xLuceneTypeConfig): BooleanCB {
    if (p.isEmptyAST(node)) {
        return isFalse;
    }

    if (p.isNegation(node)) {
        const childLogic = walkAst(node.node, typeConfig);
        return makeNegate(childLogic);
    }

    if (p.isGroupLike(node)) {
        return makeGroupFn(node, typeConfig);
    }

    const value = p.getAnyValue(node);
    const field = p.getField(node);

    if (p.isTerm(node)) {
        return logicNode(field, typeFunctions(node, typeConfig, makeIsValue(value)));
    }

    if (p.isRange(node)) {
        return logicNode(field, typeFunctions(node, typeConfig, rangeFn(node)));
    }

    if (p.isFunctionExpression(node)) {
        return logicNode(field, node.instance.match);
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
        return logicNode(field, regexp(node.value));
    }

    if (p.isWildcard(node)) {
        return logicNode(field, wildcard(node.value));
    }

    // nothing was found so return a fn that returns false
    return isFalse;
}

function typeFunctions(node: p.Term|p.Range, typeConfig: xLuceneTypeConfig, defaultCb: BooleanCB) {
    if (node.field == null) return defaultCb;

    const type: xLuceneFieldType = typeConfig[node.field];
    if (type === xLuceneFieldType.Date) {
        if (p.isRange(node)) {
            return dateRange(node);
        }
        return compareTermDates(node);
    }

    if (type === xLuceneFieldType.IP) {
        if (p.isRange(node)) {
            return ipRange(node);
        }
        return ipTerm(node);
    }

    return defaultCb;
}

function makeIsValue(value: any) {
    return function isValue(data: any) {
        return data === value;
    };
}

function makeConjunctionFn(conjunction: p.Conjunction, typeConfig: xLuceneTypeConfig) {
    const fns = conjunction.nodes.map((node) => walkAst(node, typeConfig));
    return makeAllPassFn(fns);
}

function makeGroupFn(node: p.GroupLikeAST, typeConfig: xLuceneTypeConfig) {
    const fns = node.flow.map((conjunction) => makeConjunctionFn(conjunction, typeConfig));
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
