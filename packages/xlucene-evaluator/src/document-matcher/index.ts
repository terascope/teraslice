import _ from 'lodash';
import { debugLogger } from '@terascope/utils';
import { both, either, not, identity } from 'rambda';
import LuceneQueryParser from '../lucene-query-parser';
import TypeManager from './type-manager';
import {
    bindThis,
    isInfiniteMax,
    isInfiniteMin,
    isTermNode,
    isRangeNode,
    isConjunctionNode,
    isExistsNode,
    checkValue
} from '../utils';
import { AST, TypeConfig, RangeAST, BooleanCB } from '../interfaces';

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
        const parser = new LuceneQueryParser();
        const types = typeConfig || this.typeConfig;

        parser.parse(luceneStr);
        const resultingFN = newBuilder(parser, types);
        this.filterFn = resultingFN;
    }

    public match(doc:object):boolean {
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        return this.filterFn(doc);
    }
}

const negate = (fn:any) => (data:any) => not(fn(data));

function isParsedNode(node: AST) {
    return node.type === '__parsed';
}

const logicNode = (logicFn:any) => (boolFn: BooleanCB, isNegated:boolean|undefined) => {
    if (isNegated) return logicFn(negate(boolFn));
    return logicFn(boolFn);
};

function newBuilder(parser: LuceneQueryParser, typeConfig: TypeConfig|undefined) {
    const types = new TypeManager(parser, typeConfig);
    const parsedAst = types.processAst();

    function walkAst(node: AST, resultFn: any) {
        let fnResults = resultFn;
        const fnLogic = logicNode(fnResults);

        if (isTermNode(node)) {
            const isValue = (value: any) => value === node.term;
            const fn = checkValue(node.field, isValue);
            fnResults = fnLogic(fn, node.negated);
        }

        if (isExistsNode(node)) {
            const valueExists = (value: any) => value != null;
            const fn = checkValue(node.field, valueExists);
            fnResults = fnLogic(fn, node.negated);
        }

        if (isRangeNode(node)) {
            const fn = checkValue(node.field, parseRange(node));
            fnResults = fnLogic(fn, node.negated);
        }

        if (isParsedNode(node)) {
            const fn  = node.callback;
            fnResults = fnLogic(fn, node.negated);
        }

        if (isConjunctionNode(node)) {
            let conjunctionFn:any;
            if (node.operator === 'AND' || node.operator == null) conjunctionFn = both;
            if (node.operator === 'OR') conjunctionFn = either;

            if (node.left) {
                conjunctionFn = walkAst(node.left as AST, conjunctionFn);
            } else {
                conjunctionFn = conjunctionFn(() => false);
            }

            if (node.right) {
                conjunctionFn = walkAst(node.right as AST, conjunctionFn);
            } else {
                conjunctionFn = conjunctionFn(() => true);
            }

            fnResults = fnLogic(conjunctionFn, node.negated);
        }

        return fnResults;
    }

    return walkAst(parsedAst, identity);
}

function parseRange(node: RangeAST) {
    const {
        inclusive_min: incMin,
        inclusive_max: incMax,
    } = node;
    let { term_min: minValue, term_max: maxValue } = node;
    let rangeFn = (_data: any) => false;

    if (minValue === '*') minValue = Number.NEGATIVE_INFINITY;
    if (maxValue === '*') maxValue = Number.POSITIVE_INFINITY;

    // IPs can use range syntax, if no type is set it needs to return
    // a hard coded string interpolated value
    [minValue, maxValue] = [minValue, maxValue].map((data) => {
        if (typeof data === 'string') return `"${data}"`;
        return data;
    });

    // ie age:>10 || age:(>10 AND <=20)
    if (!incMin && incMax) {
        if (isInfiniteMax(maxValue)) {
            rangeFn = (data: any) => _.gt(data, minValue);
        } else {
            rangeFn = (data: any) => _.gt(data, minValue) && _.lte(data, maxValue);
        }
    }

    // ie age:<10 || age:(<=10 AND >20)
    if (incMin && !incMax) {
        if (isInfiniteMin(minValue)) {
            rangeFn = (data: any) => _.lt(data, maxValue);
        } else {
            rangeFn = (data: any) => _.lt(data, maxValue) && _.gte(data, minValue);
        }
    }

    // ie age:<=10, age:>=10, age:(>=10 AND <=20)
    if (incMin && incMax) {
        if (isInfiniteMax(maxValue)) {
            rangeFn = (data: any) => _.gte(data, minValue);
        } else if (isInfiniteMin(minValue)) {
            rangeFn = (data: any) => _.lte(data, maxValue);
        } else {
            rangeFn = (data: any) => _.lte(data, maxValue) && _.gte(data, minValue);
        }
    }

    // ie age:(>10 AND <20)
    if (!incMin && !incMax) {
        rangeFn = (data: any) => _.lt(data, maxValue) && _.gt(data, minValue);
    }

    return rangeFn;
}
