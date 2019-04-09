
import _ from 'lodash';
import { not, allPass, anyPass } from 'rambda';

import { checkValue } from '../../utils';

import { TypeConfig, BooleanCB } from '../../interfaces';
import { geoDistance,  geoBoundingBox } from './geo';
import { regexp, wildcard } from './string';
import {
    Parser,
    AST,
    Range,

    getAnyValue,
    getField,

    isTerm,
    isExists,
    isRange,
    isLogicalGroup,
    isNegation,
    isFieldGroup,
    isGeoDistance,
    isGeoBoundingBox,
    isRegexp,
    isWildcard
} from '../../parser';

const negate = (fn:any) => (data:any) => not(fn(data));

const logicNode = (boolFn: BooleanCB, node:AST) => {
    if (isNegation(node)) return negate(boolFn);
    return boolFn;
};

export default function buildLogicFn(parser: Parser, typeConfig: TypeConfig|undefined) {
    // const types = new TypeManager(parser, typeConfig);
    // const parsedAst = types.processAst();
    // console.log('original ast', JSON.stringify(parser.ast, null, 4));
    function walkAst(node: AST): BooleanCB {
        let fnResults;
        const value = getAnyValue(node);
        const field = getField(node);

        if (isNegation(node)) {
            // @ts-ignore
            const childLogic = walkAst(node.node);
            fnResults = negate(childLogic);
        }

        // TODO: Deal with regex and wildcard
        if (isTerm(node)) {
            const isValue = (data: any) => {
                return data === value;
            };
            const fn = checkValue(field as string, isValue);
            fnResults = logicNode(fn, node);
        }

        if (isGeoDistance(node)) {
            const fn = checkValue(field as string, geoDistance(node));
            fnResults = logicNode(fn, node);
        }

        if (isGeoBoundingBox(node)) {
            const fn = checkValue(field as string, geoBoundingBox(node));
            fnResults = logicNode(fn, node);
        }

        if (isExists(node)) {
            const valueExists = (value: any) => value != null;
            const fn = checkValue(field, valueExists);
            fnResults = logicNode(fn, node);
        }

        if (isRange(node)) {
            const fn = checkValue(field, rangeFn(node));
            fnResults = logicNode(fn, node);
        }

        if (isRegexp(node)) {
            const fn = checkValue(field, regexp(node.value));
            fnResults = logicNode(fn, node);
        }

        if (isWildcard(node)) {
            const fn = checkValue(field, wildcard(node.value));
            fnResults = logicNode(fn, node);
        }

        if (isLogicalGroup(node) || isFieldGroup(node)) {
            const logicGroups: BooleanCB[] = [];

            node.flow.forEach(conjunction => {
                const conjunctionRules = conjunction.nodes.map(node => walkAst(node));
                logicGroups.push(allPass(conjunctionRules));
            });

            fnResults = logicNode(anyPass(logicGroups), node);
        }

        if (!fnResults) fnResults = () => false;
        return fnResults;
    }

    return walkAst(parser.ast);
}

function rangeFn(node: Range): BooleanCB {
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
