
import _ from 'lodash';
import { not, allPass, anyPass } from 'rambda';
import { geoDistance,  geoBoundingBox } from './geo';
import { compareTermDates, dateRange } from './dates';
import { ipTerm, ipRange } from './ip';
import { regexp, wildcard } from './string';
import * as p from '../../parser';
import { checkValue } from '../../utils';
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
            const fn = checkValue(field, typeFunctions(node, isValue));
            return logicNode(fn, node);
        }

        if (p.isRange(node)) {
            const fn = checkValue(field, typeFunctions(node, rangeFn(node)));
            return logicNode(fn, node);
        }

        if (p.isGeoDistance(node)) {
            const fn = checkValue(field, geoDistance(node));
            return logicNode(fn, node);
        }

        if (p.isGeoBoundingBox(node)) {
            const fn = checkValue(field, geoBoundingBox(node));
            return logicNode(fn, node);
        }

        if (p.isExists(node)) {
            const valueExists = (value: any) => value != null;
            const fn = checkValue(field, valueExists);
            return logicNode(fn, node);
        }

        if (p.isRegexp(node)) {
            const fn = checkValue(field, regexp(node.value));
            return logicNode(fn, node);
        }

        if (p.isWildcard(node)) {
            const fn = checkValue(field, wildcard(node.value));
            return logicNode(fn, node);
        }

        if (p.isLogicalGroup(node) || p.isFieldGroup(node)) {
            const logicGroups: BooleanCB[] = [];

            node.flow.forEach(conjunction => {
                const conjunctionRules = conjunction.nodes.map(node => walkAst(node));
                logicGroups.push(allPass(conjunctionRules));
            });

            return logicNode(anyPass(logicGroups), node);
        }

        // nothing was found so return a fn that returns false
        return () => false;
    }

    return walkAst(parser.ast);
}

function negate(fn:any) {
    return (data:any) => not(fn(data));
}

function logicNode(boolFn: BooleanCB, node:p.AnyAST) {
    if (p.isNegation(node)) return negate(boolFn);
    return boolFn;
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
