import _ from 'lodash';
import { debugLogger } from '@terascope/utils';
import { both, either, not, path, identity, has, pipe } from 'rambda';
import LuceneQueryParser from '../lucene-query-parser';
import TypeManager from './type-manager';
import { bindThis, isInfiniteMax, isInfiniteMin, isTermNode, isRangeNode, isConjunctionNode, isExistsNode } from '../utils';
import { AST, TypeConfig, RangeAST } from '../interfaces';

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

function newBuilder(parser: LuceneQueryParser, typeConfig: TypeConfig|undefined) {
    const types = new TypeManager(parser, typeConfig);
    const parsedAst = types.processAst();

    function walkAst(node: AST, resultFn: any) {
        let fnResults = resultFn;
        if (isTermNode(node)) {
            let fn = (obj: any) => path(node.field, obj) === node.term;
            if (node.negated) {
                fn = negate(fn);
            }
            fnResults = fnResults(fn);
        }

        if (isExistsNode(node)) {
            let fn = (obj: any) =>  has(node.field, obj);

            if (node.negated) {
                fn = negate(fn);
            }

            fnResults = fnResults(fn);
        }

        if (isRangeNode(node)) {
            let fn = parseRange(node);

            if (node.negated) {
                fn = negate(fn);
            }

            fnResults = fnResults(fn);
        }

        if (isParsedNode(node)) {
            let fn  = node.callback;
            if (node.negated) {
                fn = negate(fn);
            }

            fnResults = fnResults(fn);
        }

        if (isConjunctionNode(node)) {
            let conjunctionFn:any;
            if (node.operator === 'AND' || node.operator === 'NOT' || node.operator == null) conjunctionFn = both;
            if (node.operator === 'OR') {
                conjunctionFn = either;
            }

            if (node.left) {
                conjunctionFn = walkAst(node.left as AST, conjunctionFn);

            } else {
                conjunctionFn = conjunctionFn(() => false);
            }

            if (node.right) {
                conjunctionFn = walkAst(node.right as AST, conjunctionFn);

            } else {
               // FIXME: this will mess up with an either
                conjunctionFn = conjunctionFn(() => true);
            }

            if (node.negated) {
                fnResults = fnResults(negate(conjunctionFn));
            } else {
                fnResults = fnResults(conjunctionFn);
            }
        }

        return fnResults;
    }

    return walkAst(parsedAst, identity);
}

function parseRange(node: RangeAST) {
    const {
        inclusive_min: incMin,
        inclusive_max: incMax,
        field
    } = node;
    let { term_min: minValue, term_max: maxValue } = node;
    let rangeFn = (_obj: any) => false;

    if (minValue === '*') minValue = Number.NEGATIVE_INFINITY;
    if (maxValue === '*') maxValue = Number.POSITIVE_INFINITY;

    // IPs can use range syntax, if no type is set it needs to return
    // a hard coded string interpolated value
    [minValue, maxValue] = [minValue, maxValue].map((data) => {
        if (typeof data === 'string') return `"${data}"`;
        return data;
    });

    const getFieldValue = (obj: any) => path(field, obj);

    // ie age:>10 || age:(>10 AND <=20)
    if (!incMin && incMax) {
        if (isInfiniteMax(maxValue)) {
            rangeFn = (obj: any) => _.gt(obj, minValue);
        } else {
            rangeFn = (obj: any) => _.gt(obj, minValue) && _.lte(obj, maxValue);
        }
    }

    // ie age:<10 || age:(<=10 AND >20)
    if (incMin && !incMax) {
        if (isInfiniteMin(minValue)) {
            rangeFn = (obj: any) => _.lt(obj, maxValue);

        } else {
            rangeFn = (obj: any) => _.lt(obj, maxValue) && _.gte(obj, minValue);
        }
    }

    // ie age:<=10, age:>=10, age:(>=10 AND <=20)
    if (incMin && incMax) {
        if (isInfiniteMax(maxValue)) {
            rangeFn = (obj: any) => _.gte(obj, minValue);
        } else if (isInfiniteMin(minValue)) {
            rangeFn = (obj: any) => _.lte(obj, maxValue);
        } else {
            rangeFn = (obj: any) => _.lte(obj, maxValue) && _.gte(obj, minValue);

        }
    }

    // ie age:(>10 AND <20)
    if (!incMin && !incMax) {
        rangeFn = (obj: any) => _.lt(obj, maxValue) && _.gt(obj, minValue);

    }

    return pipe(getFieldValue, rangeFn);
}
