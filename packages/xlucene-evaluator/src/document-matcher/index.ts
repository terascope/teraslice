import _ from 'lodash';
import { debugLogger } from '@terascope/utils';
// @ts-ignore
import { both, either, not, identity, allPass, anyPass } from 'rambda';
import {
    Parser,
    AST,
    isTerm,
    isExists,
    // @ts-ignore

    isRange,
    // @ts-ignore
    isConjunction,
    isLogicalGroup,
    getAnyValue,
    getField,
    isNegation,
    isFieldGroup
} from '../parser';

// import TypeManager from './type-manager';

import {
    bindThis,
    checkValue
} from '../utils';

import { TypeConfig, BooleanCB } from '../interfaces';

// @ts-ignore
const logger = debugLogger('document-matcher');

export default class DocumentMatcher {
    private filterFn: Function|undefined;
    private typeConfig: TypeConfig|undefined;

    constructor(luceneStr?: string, typeConfig?: TypeConfig) {
        this.typeConfig = typeConfig;
        bindThis(this, DocumentMatcher);

        if (luceneStr) {
            this.parse(luceneStr);
        }
    }

    public parse(luceneStr: string, typeConfig?: TypeConfig):void {
        const parser = new Parser(luceneStr);
        const types = typeConfig || this.typeConfig;
        const resultingFN = buildLogicFn(parser, types);
        this.filterFn = resultingFN;
    }

    public match(doc:object):boolean {
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        return this.filterFn(doc);
    }
}

const negate = (fn:any) => (data:any) => not(fn(data));

const logicNode = (boolFn: BooleanCB, node:AST) => {
    if (isNegation(node)) return negate(boolFn);
    return boolFn;
};

function buildLogicFn(parser: Parser, typeConfig: TypeConfig|undefined) {
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

        if (isExists(node)) {
            const valueExists = (value: any) => value != null;
            const fn = checkValue(field, valueExists);
            fnResults = logicNode(fn, node);
        }

        // if (isRange(node)) {
        //     const fn = checkValue(node.field, parseRange(node));
        //     fnResults = logicNode(fn, node);
        // }

        // if (isParsedNode(node)) {
        //     const fn  = node.callback;
        //     fnResults = logicNode(fn, node.negated);
        // }

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

// function parseRange(node: RangeAST) {
//     const {
//         inclusive_min: incMin,
//         inclusive_max: incMax,
//     } = node;
//     let { term_min: minValue, term_max: maxValue } = node;
//     let rangeFn = (_data: any) => false;

//     if (minValue === '*') minValue = Number.NEGATIVE_INFINITY;
//     if (maxValue === '*') maxValue = Number.POSITIVE_INFINITY;

//     // IPs can use range syntax, if no type is set it needs to return
//     // a hard coded string interpolated value
//     [minValue, maxValue] = [minValue, maxValue].map((data) => {
//         if (typeof data === 'string') return `"${data}"`;
//         return data;
//     });

//     // ie age:>10 || age:(>10 AND <=20)
//     if (!incMin && incMax) {
//         if (isInfiniteMax(maxValue)) {
//             rangeFn = (data: any) => _.gt(data, minValue);
//         } else {
//             rangeFn = (data: any) => _.gt(data, minValue) && _.lte(data, maxValue);
//         }
//     }

//     // ie age:<10 || age:(<=10 AND >20)
//     if (incMin && !incMax) {
//         if (isInfiniteMin(minValue)) {
//             rangeFn = (data: any) => _.lt(data, maxValue);
//         } else {
//             rangeFn = (data: any) => _.lt(data, maxValue) && _.gte(data, minValue);
//         }
//     }

//     // ie age:<=10, age:>=10, age:(>=10 AND <=20)
//     if (incMin && incMax) {
//         if (isInfiniteMax(maxValue)) {
//             rangeFn = (data: any) => _.gte(data, minValue);
//         } else if (isInfiniteMin(minValue)) {
//             rangeFn = (data: any) => _.lte(data, maxValue);
//         } else {
//             rangeFn = (data: any) => _.lte(data, maxValue) && _.gte(data, minValue);
//         }
//     }

//     // ie age:(>10 AND <20)
//     if (!incMin && !incMax) {
//         rangeFn = (data: any) => _.lt(data, maxValue) && _.gt(data, minValue);
//     }

//     return rangeFn;
// }
