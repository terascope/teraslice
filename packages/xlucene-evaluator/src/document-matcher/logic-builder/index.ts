
import _ from 'lodash';
import { path, any, values, not, allPass, anyPass } from 'rambda';
import { geoDistance,  geoBoundingBox } from './geo';
import { compareTermDates, dateRange } from './dates';
import { ipTerm, ipRange } from './ip';
import { regexp, wildcard, isWildCard, findWildcardField } from './string';
import * as p from '../../parser';
import { TypeConfig, BooleanCB } from '../../interfaces';

export default function buildLogicFn(parser: p.Parser, typeConfig: TypeConfig|undefined = {}) {

    function typeFunctions(node:p.Term|p.Range, defaultCb: BooleanCB) {
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

    function walkAst(node: p.AnyAST): BooleanCB {
        const value = p.getAnyValue(node);
        const field = p.getField(node);

        if (p.isEmptyAST(node)) {
            return () => false;
        }

        if (p.isNegation(node)) {
            const childLogic = walkAst(node.node);
            return negate(childLogic);
        }

        if (p.isTerm(node)) {
            const isValue = (data: any) => data === value;
            return logicNode(field, typeFunctions(node, isValue));
        }

        if (p.isRange(node)) {
            return logicNode(field, typeFunctions(node, rangeFn(node)));
        }

        if (p.isGeoDistance(node)) {
            return logicNode(field, geoDistance(node));
        }

        if (p.isGeoBoundingBox(node)) {
            return logicNode(field, geoBoundingBox(node));
        }

        if (p.isExists(node)) {
            const valueExists = (value: any) => value != null;
            return logicNode(field, valueExists);
        }

        if (p.isRegexp(node)) {
            return logicNode(field, regexp(node.value));
        }

        if (p.isWildcard(node)) {
            return logicNode(field, wildcard(node.value));
        }

        if (p.isLogicalGroup(node) || p.isFieldGroup(node)) {
            const logicGroups: BooleanCB[] = [];

            node.flow.forEach(conjunction => {
                const conjunctionRules = conjunction.nodes.map(node => walkAst(node));
                logicGroups.push(allPass(conjunctionRules));
            });

            return anyPass(logicGroups);
        }

        // nothing was found so return a fn that returns false
        return () => false;
    }

    return walkAst(parser.ast);
}

function logicNode(field: string|undefined, cb: BooleanCB) {
    if (field && isWildCard(field)) {
        return findWildcardField(field, cb);
    }
    return (obj: any) => {
        let data;
        if (field) {
            data = path(field, obj);
        } else {
            data = values(obj);
        }

        if (Array.isArray(data)) {
            return any(cb, data);
        }
        return cb(data);
    };
}

function negate(fn:any) {
    return (data:any) => not(fn(data));
}

function rangeFn(node: p.Range): BooleanCB {
    const mapping = {
        gte: _.gte,
        gt: _.gt,
        lte: _.lte,
        lt: _.lt
    };
    const { left, right } = node;

    if (!right) {
        return (data: any) => mapping[left.operator](data, left.value);
    }

    return (data: any) => mapping[left.operator](data, left.value) && mapping[right.operator](data, right.value);
}
