import _ from 'lodash';
// @ts-ignore

import { isString, debugLogger } from '@terascope/utils';
// @ts-ignore
import { both, either, not, path, identity, has, pipe } from 'rambda';
import LuceneQueryParser from '../lucene-query-parser';
import TypeManager from './type-manager';
// @ts-ignore
import { bindThis, isInfiniteMax, isInfiniteMin, isExistsNode, isTermNode, isRangeNode, isConjunctionNode, isExistsNode } from '../utils';
import { AST, TypeConfig, RangeAST, IMPLICIT } from '../interfaces';
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
        // console.log('what coming out', resultingFN);
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
    // @ts-ignore
    const AND_MAPPING = { AND: true, NOT: true };
    // default operator in elasticsearch is OR
    const OR_MAPPING = { OR: true };
    OR_MAPPING[IMPLICIT] = true;

    function walkAst(node: AST, resultFn: any) {
        let fnResults = resultFn;
        if (isTermNode(node)) {
            // console.log('i should be here twice', node)
            let fn = (obj: any) => {
               // console.log('im executing', node, obj, path(node.field, obj), path(node.field, obj) === node.term)
                return path(node.field, obj) === node.term;
            };
            if (node.negated) {
                fn = negate(fn);
            }
            // console.log('i should be adding before', resultFn)
            fnResults = fnResults(fn);
            // console.log('i should be adding after', resultFn)
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
            // console.log('what is node', node)
            let conjunctionFn:any;
            if (node.operator === 'AND' || node.operator === 'NOT' || node.operator == null) conjunctionFn = both;
            if (node.operator === 'OR') {
                // console.log('im setting to either', node)
                conjunctionFn = either;
            }

            if (node.left) {
                conjunctionFn = walkAst(node.left as AST, conjunctionFn);
             // console.log('i should be recursing left', conjunctionFn)

            } else {
                conjunctionFn = conjunctionFn(() => false);
            }

            if (node.right) {
                conjunctionFn = walkAst(node.right as AST, conjunctionFn);
                // console.log('i should be recursing right', fnResults)

            } else {
               //  console.log('im setting right')
               // FIXME: this will mess up with an either
                conjunctionFn = conjunctionFn(() => true);
               //  console.log('im setting right', resultFn)

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

// function functionBuilder(node: AST, parent: AST, fnStrBody: string, _field: string|null) {
//     const field = (node.field && node.field !== IMPLICIT) ? node.field : _field;
//     let fnStr = '';

//     if (node.type === 'conjunction') {
//         if (node.parens) {
//             fnStr += node.negated ? '!(' : '(';
//         }

//         if (node.left != null) {
//             fnStr += '(';
//             fnStr += functionBuilder(node.left, node, '', field);
//             fnStr += ')';
//         }

//         if (node.left && node.right && node.operator && OR_MAPPING[node.operator]) fnStr += ' || ';
//         if (node.left && node.right && node.operator && AND_MAPPING[node.operator]) fnStr += ' && ';

//         if (node.right != null) {
//             fnStr += '(';
//             fnStr += functionBuilder(node.right, node, '', field);
//             fnStr += ')';
//         }

//         if (node.parens) {
//             fnStr += ')';
//         }
//     } else {
//         fnStr += node.negated ? '!(' : '(';

//         if (isExistsNode(node)) {
//             fnStr += `data.${node.field} != null`;
//         }

//         if (field && isTermNode(node)) {
//             if (field === '__parsed') {
//                 fnStr += `${node.term}`;
//             } else {
//                 const value = isString(node.term) ? `"${node.term}"` : node.term;
//                 fnStr += `data.${field} === ${value}`;
//             }
//         }

//         if (isRangeNode(node)) {
//             fnStr += parseRange(node, field || '');
//         }

//         fnStr += ')';
//     }

//     return `${fnStrBody}${fnStr}`;
// }

// const fnStr = functionBuilder(parsedAst, {} as AST, '', null);
// const argsObj = types.injectTypeFilterFns();
// const argsFns: Function[] = [];
// const strFnArgs:string[] = [];

// _.forOwn(argsObj, (value, key) => {
//     strFnArgs.push(key);
//     argsFns.push(value);
// });
// // injecting lodash
// strFnArgs.push('get');
// argsFns.push(_.get);
// strFnArgs.push('data', `return ${fnStr}`);

// logger.trace('created filter fn', fnStr);
// try {
//     // tslint:disable-next-line no-function-constructor-with-string-args
//     const strFilterFunction = new Function(...strFnArgs);
//     this.filterFn = (data:object) => strFilterFunction(...argsFns, data);
// } catch (err) {
//     throw new Error(`error while attempting to build filter function \n\n new function: ${fnStr} \n\nerror: ${err.message}`);
