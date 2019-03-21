import _ from 'lodash';
import { isString } from '@terascope/utils';
import LuceneQueryParser from '../lucene-query-parser';
import TypeManager from './type-manager';
import { bindThis, isInfiniteMax, isInfiniteMin, isExistsNode, isTermNode, isRangeNode } from '../utils';
import { AST, TypeConfig, RangeAST, IMPLICIT } from '../interfaces';

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

        function functionBuilder(node: AST, parent: AST, fnStrBody: string, _field: string|null, isNegation:Boolean) {
            const field = (node.field && node.field !== IMPLICIT) ? node.field : _field;
            let addParens = false;
            let negation  = isNegation || false;
            let negateLeftExp = false;
            let fnStr = '';

            if (node.operator === 'NOT') {
                negation = true;
            }

            // The left is automatically a negated if there is no right
            if (node.operator === 'NOT' && !node.right) {
                negateLeftExp = true;
            }

            if (negation && parent.operator === 'NOT') {
                negateLeftExp = true;
            }

            if (node.parens) {
                fnStr += '(';
                addParens = true;
            }

            if (isExistsNode(node)) {
                if (negation) {
                    fnStr += `data.${node.field} == null`;
                } else {
                    fnStr += `data.${node.field} != null`;
                }
            }

            if (field && isTermNode(node)) {
                if (field === '__parsed') {
                    if (negation) {
                        fnStr += `!(${node.term})`;
                    } else {
                        fnStr += `${node.term}`;
                    }
                } else {
                    const value = isString(node.term) ? `"${node.term}"` : node.term;
                    if (negation) {
                        fnStr += `data.${field} !== ${value}`;
                    } else {
                        fnStr += `data.${field} === ${value}`;
                    }
                }
            }

            if (isRangeNode(node)) {
                fnStr += parseRange(node, field || '', negation);
            }

            if (node.left != null) {
                fnStr += functionBuilder(node.left, node, '', field, negateLeftExp);
            }

            if (node.left && node.operator && OR_MAPPING[node.operator]) fnStr += ' || ';
            if (node.right && node.operator && AND_MAPPING[node.operator]) fnStr += ' && ';

            if (node.right != null) {
                fnStr += functionBuilder(node.right, node, '', field, negation);
            }

            if (addParens) {
                addParens = false;
                fnStr += ')';
            }

            return fnStrBody + fnStr;
        }

        const fnStr = functionBuilder(parsedAst, {} as AST, '', null, false);
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

        try {
            // tslint:disable-next-line no-function-constructor-with-string-args
            const strFilterFunction = new Function(...strFnArgs);
            this.filterFn = (data:object) => strFilterFunction(...argsFns, data);
        } catch (err) {
            throw new Error(`error while attempting to build filter function \n\n new function components: ${strFnArgs} \n\nerror: ${err.message}`);
        }
    }

    private _parseRange(node: RangeAST, topFieldName:string, isNegation:Boolean):string {
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

        if (isNegation) return `!(${resultStr})`;
        return resultStr;
    }

    public match(doc:object):boolean {
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        return this.filterFn(doc);
    }
}
