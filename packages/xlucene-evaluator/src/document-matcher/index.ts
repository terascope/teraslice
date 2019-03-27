import _ from 'lodash';
// @ts-ignore

import { isString, debugLogger } from '@terascope/utils';
// @ts-ignore
import { both, either, not, path, identity, has } from 'rambda';
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
                console.log('im executing', node, obj, path(node.field, obj), path(node.field, obj) === node.term)
                return path(node.field, obj) === node.term;
            };
            if (node.negated) {
                console.log('i should not be here in negation')
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

        if (isConjunctionNode(node)) {
            // console.log('what is node', node)
            let conjunctionFn:any;
            console.log('what node', node)
            if (node.operator === 'AND' || node.operator === 'NOT'|| node.operator == null) conjunctionFn = both;
            if (node.operator === 'OR' ) {
                console.log('im setting to either', node)
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
                conjunctionFn = conjunctionFn(() => true);
               //  console.log('im setting right', resultFn)

            }
            fnResults = fnResults(conjunctionFn);
        }

        return fnResults;
    }

    return walkAst(parsedAst, identity);
}
// @ts-ignore
function parseRange(node: RangeAST, topFieldName:string, isNegation:Boolean):string {
    const {
        inclusive_min: incMin,
        inclusive_max: incMax,
        field = topFieldName
    } = node;
    let { term_min: minValue, term_max: maxValue } = node;
    let resultStr = '';

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
            resultStr = `get(data, "${field}") > ${minValue}`;
        } else {
            resultStr = `((${maxValue} >= get(data, "${field}")) && (get(data, "${field}") > ${minValue}))`;
        }
    }

    // ie age:<10 || age:(<=10 AND >20)
    if (incMin && !incMax) {
        if (isInfiniteMin(minValue)) {
            resultStr = `get(data, "${field}") < ${maxValue}`;
        } else {
            resultStr =  `((${minValue} <= get(data, "${field}")) && (get(data, "${field}") < ${maxValue}))`;
        }
    }

    // ie age:<=10, age:>=10, age:(>=10 AND <=20)
    if (incMin && incMax) {
        if (isInfiniteMax(maxValue)) {
            resultStr = `get(data, "${field}") >= ${minValue}`;
        } else if (isInfiniteMin(minValue)) {
            resultStr = `get(data, "${field}") <= ${maxValue}`;
        } else {
            resultStr = `((${maxValue} >= get(data, "${field}")) && (get(data, "${field}") >= ${minValue}))`;
        }
    }

    // ie age:(>10 AND <20)
    if (!incMin && !incMax) {
        resultStr = `((${maxValue} > get(data, "${field}")) && (get(data, "${field}") > ${minValue}))`;
    }

    return resultStr;
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
