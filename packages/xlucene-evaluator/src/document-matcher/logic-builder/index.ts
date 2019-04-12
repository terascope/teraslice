
import _ from 'lodash';
import fp from 'lodash/fp';
import { geoDistance,  geoBoundingBox } from './geo';
import { compareTermDates, dateRange } from './dates';
import { ipTerm, ipRange } from './ip';
import { regexp, wildcard, isWildCard, findWildcardField } from './string';
import * as p from '../../parser';
import { TypeConfig, BooleanCB } from '../../interfaces';

export default function buildLogicFn(parser: p.Parser, typeConfig: TypeConfig = {}) {
    return walkAst(parser.ast, typeConfig);
}

function makeGetFn(field?: string) {
    if (!field) return fp.values;
    if (field.includes('.')) return fp.get(field);

    return function getProp(obj: any) {
        return obj[field];
    };
}

function logicNode(field: string|undefined, cb: BooleanCB) {
    if (field && isWildCard(field)) {
        return findWildcardField(field, cb);
    }
    const get = makeGetFn(field);
    const getAnyData = makeSomeFn(cb);

    return function _logicNode(obj: any) {
        const data = get(obj);

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

function makeNegate(fn:any) {
    return function negate(data:any) {
        return !fn(data);
    };
}

const rangeMapping = {
    gte: _.gte,
    gt: _.gt,
    lte: _.lte,
    lt: _.lt
};

function rangeFn(node: p.Range): BooleanCB {
    const { left, right } = node;

    if (!right) {
        return function singleRangeTerm(data: any) {
            return rangeMapping[left.operator](data, left.value);
        };
    }

    return function doubleRangeTerm(data: any) {
        return rangeMapping[left.operator](data, left.value) && rangeMapping[right.operator](data, right.value);
    };
}

function valueExists(value: any) {
    return value != null;
}

function isFalse() {
    return false;
}

function walkAst(node: p.AnyAST, typeConfig: TypeConfig): BooleanCB {
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

function typeFunctions(node:p.Term|p.Range, typeConfig: TypeConfig, defaultCb: BooleanCB) {
    if (node.field == null) return defaultCb;

    const type = typeConfig[node.field];
    if (type === 'date') {
        if (p.isRange(node)) {
            return dateRange(node);
        }
        return compareTermDates(node);
    }

    if (type === 'ip') {
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

function makeConjunctionFn(conjunction: p.Conjunction, typeConfig: TypeConfig) {
    const fns = conjunction.nodes.map((node) => walkAst(node, typeConfig));
    return makeAllPassFn(fns);
}

function makeGroupFn(node: p.GroupLikeAST, typeConfig: TypeConfig) {
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
