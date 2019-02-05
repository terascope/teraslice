'use strict';

import _ from 'lodash';
import LuceneQueryParser from '../lucene-query-parser';
import TypeManger from './type-manager';
import { bindThis } from '../utils';
import { IMPLICIT } from '../constants';
import { AST } from '../interfaces';

export default class DocumentMatcher extends LuceneQueryParser {
    private filterFn: Function|undefined;
    private types: TypeManger;

    constructor(luceneStr?: string, typeConfig?:object) {
        super();
        this.types = new TypeManger(typeConfig);
        bindThis(this, DocumentMatcher);

        if (luceneStr) {
            this.parse(luceneStr);
            this._buildFilterFn();
        }
    }

    public parse(luceneStr: string, typeConfig?: object):void {
        if (typeConfig) {
            this.types = new TypeManger(typeConfig);
        }
        super.parse(luceneStr);
        this._buildFilterFn();
    }

    private _buildFilterFn(): void {
        // tslint:disable-next-line
        const { _ast: ast, types, _parseRange: parseRange } = this;

        const parsedAst = types.processAst(ast);
        const AND_MAPPING = { AND: true, 'AND NOT': true, NOT: 'true' };
        // default operator in elasticsearch is OR
        const OR_MAPPING = { OR: true };
        OR_MAPPING[IMPLICIT] = true;

        function functionBuilder(node: AST, parent: Partial<AST>, fnStrBody: string, _field: string|null, isNegation:Boolean) {
            const field = (node.field && node.field !== IMPLICIT) ? node.field : _field;
            let addParens = false;
            let negation  = isNegation || false;
            let negateLeftExp = false;
            let fnStr = '';

            if (node.operator === 'AND NOT' || node.operator === 'NOT') {
                negation = true;
            }

            if (negation && parent.operator === 'AND NOT' || parent.operator === 'NOT') {
                negateLeftExp = true;
            }

            if (node.parens) {
                fnStr += '(';
                addParens = true;
            }
            if (field && _.has(node, 'term')) {
                if (field === '_exists_') {
                    if (negation) {
                        fnStr += `data.${node.term} == null`;
                    } else {
                        fnStr += `data.${node.term} != null`;
                    }
                } else if (field === '__parsed') {
                    if (negation) {
                        fnStr += `!(${node.term})`;
                    } else {
                        fnStr += `${node.term}`;
                    }
                } else {
                    let term = `"${node.term}"`;
                    if (node.term === 'true') term = JSON.parse(node.term);
                    if (node.term === 'false') term = JSON.parse(node.term);
                    if (negation) {
                        fnStr += `data.${field} != ${term}`;
                    } else {
                        fnStr += `data.${field} == ${term}`;
                    }
                }
            }
            if (_.has(node, 'term_min')) {
                fnStr += parseRange(node, field || '', negation);
            }

            if (node.left != null) {
                fnStr += functionBuilder(node.left, node, '', field, negateLeftExp);
            }

            if (node.operator && OR_MAPPING[node.operator]) fnStr += ' || ';
            if (node.operator && AND_MAPPING[node.operator]) fnStr += ' && ';

            if (node.right != null) {
                fnStr += functionBuilder(node.right, node, '', field, negation);
            }

            if (addParens) {
                addParens = false;
                fnStr += ')';
            }

            return fnStrBody + fnStr;
        }

        const fnStr = functionBuilder(parsedAst, {}, '', null, false);
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

    private _parseRange(node:AST, topFieldName:string, isNegation:Boolean):string {
        const {
            inclusive_min: incMin,
            inclusive_max: incMax,
            field = topFieldName
        } = node;
        let { term_min: minValue, term_max: maxValue } = node;
        let resultStr = '';

        if (minValue === '*') minValue = -Infinity;
        if (maxValue === '*') maxValue = Infinity;

        // IPs can use range syntax, if no type is set it needs to return
        // a hard coded string interpolated value
        [minValue, maxValue] = [minValue, maxValue].map((data) => {
            if (typeof data === 'string') return `"${data}"`;
            return data;
        });

        // ie age:>10 || age:(>10 AND <=20)
        if (!incMin && incMax) {
            if (maxValue === Infinity) {
                resultStr = `get(data, "${field}") > ${minValue}`;
            } else {
                resultStr = `((${maxValue} >= get(data, "${field}")) && (get(data, "${field}") > ${minValue}))`;
            }
        }

        // ie age:<10 || age:(<=10 AND >20)
        if (incMin && !incMax) {
            if (minValue === -Infinity) {
                resultStr = `get(data, "${field}") < ${maxValue}`;
            } else {
                resultStr =  `((${minValue} <= get(data, "${field}")) && (get(data, "${field}") < ${maxValue}))`;
            }
        }

        // ie age:<=10, age:>=10, age:(>=10 AND <=20)
        if (incMin && incMax) {
            if (maxValue === Infinity) {
                resultStr = `get(data, "${field}") >= ${minValue}`;
            } else if (minValue === -Infinity) {
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
