import _ from 'lodash';
import { isString, debugLogger } from '@terascope/utils';
import LuceneQueryParser from '../lucene-query-parser';
import TypeManager from './type-manager';
import { bindThis, isInfiniteMax, isInfiniteMin, isExistsNode, isTermNode, isRangeNode } from '../utils';
import { AST, TypeConfig, RangeAST, IMPLICIT } from '../interfaces';

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
        parser.parse(luceneStr);
        this._buildFilterFn(parser, typeConfig);
    }

    private _buildFilterFn(parser: LuceneQueryParser, typeConfig: TypeConfig|undefined = this.typeConfig): void {
        const types = new TypeManager(parser, typeConfig);

        // tslint:disable-next-line
        const { _parseRange: parseRange } = this;

        const parsedAst = types.processAst();
        const AND_MAPPING = { AND: true, NOT: true };
        // default operator in elasticsearch is OR
        const OR_MAPPING = { OR: true };
        OR_MAPPING[IMPLICIT] = true;

        function functionBuilder(node: AST, parent: AST, fnStrBody: string, _field: string|null) {
            const field = (node.field && node.field !== IMPLICIT) ? node.field : _field;
            let fnStr = '';

            logger.trace('build fn for node', {
                field,
                node,
                // parent,
            });

            if (node.type === 'conjunction') {
                if (node.parens) {
                    fnStr += node.negated ? '!(' : '(';
                }

                if (node.left != null) {
                    fnStr += '(';
                    fnStr += functionBuilder(node.left, node, '', field);
                    fnStr += ')';
                }

                if (node.left && node.right && node.operator && OR_MAPPING[node.operator]) fnStr += ' || ';
                if (node.left && node.right && node.operator && AND_MAPPING[node.operator]) fnStr += ' && ';

                if (node.right != null) {
                    fnStr += '(';
                    fnStr += functionBuilder(node.right, node, '', field);
                    fnStr += ')';
                }

                if (node.parens) {
                    fnStr += ')';
                }
            } else {
                fnStr += node.negated ? '!(' : '(';

                if (isExistsNode(node)) {
                    fnStr += `data.${node.field} != null`;
                }

                if (field && isTermNode(node)) {
                    if (field === '__parsed') {
                        fnStr += `${node.term}`;
                    } else {
                        const value = isString(node.term) ? `"${node.term}"` : node.term;
                        fnStr += `data.${field} === ${value}`;
                    }
                }

                if (isRangeNode(node)) {
                    fnStr += parseRange(node, field || '');
                }

                fnStr += ')';
            }

            return `${fnStrBody}${fnStr}`;
        }

        const fnStr = functionBuilder(parsedAst, {} as AST, '', null);
        const argsObj = types.injectTypeFilterFns();
        const argsFns: Function[] = [];
        const strFnArgs:string[] = [];

        _.forOwn(argsObj, (value, key) => {
            strFnArgs.push(key);
            argsFns.push(value);
        });
        // injecting lodash
        strFnArgs.push('get');
        argsFns.push(_.get);
        strFnArgs.push('data', `return ${fnStr}`);

        logger.trace('created filter fn', fnStr);
        try {
            // tslint:disable-next-line no-function-constructor-with-string-args
            const strFilterFunction = new Function(...strFnArgs);
            this.filterFn = (data:object) => strFilterFunction(...argsFns, data);
        } catch (err) {
            throw new Error(`error while attempting to build filter function \n\n new function: ${fnStr} \n\nerror: ${err.message}`);
        }
    }

    private _parseRange(node: RangeAST, topFieldName:string):string {
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

    public match(doc:object):boolean {
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        return this.filterFn(doc);
    }
}
