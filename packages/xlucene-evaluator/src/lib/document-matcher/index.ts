'use strict';

import _ from 'lodash';
import LuceneQueryParser from '../lucene-query-parser';
import TypeManger from './type-manager';
import { bindThis, ast } from '../utils';

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

    public parse(luceneStr: string, typeConfig?: object) {
        if (typeConfig) {
            this.types = new TypeManger(typeConfig);
        }
        super.parse(luceneStr);
        this._buildFilterFn();
    }

    private _buildFilterFn() {
        const { _ast: ast, types, _parseRange: parseRange } = this;
        const parsedAst = types.processAst(ast);
        const AND_MAPPING = { AND: true, 'AND NOT': true, NOT: 'true' };
        // default operator in elasticsearch is OR
        const OR_MAPPING = { OR: true, '<implicit>': true };

        function functionBuilder(node:ast, parent: ast, fnStrBody: string, _field:string, isNegation:Boolean) {
            const field = (node.field && node.field !== "<implicit>") ? node.field : _field;
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
            if (field && node.term) {
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
                    if (negation) {
                        fnStr += `data.${field} != "${node.term}"`;
                    } else {
                        fnStr += `data.${field} == "${node.term}"`;
                    }
                }
            }
            if (node.term_min) {
                fnStr += parseRange(node, field, negation);
            }

            if (node.left) {
                fnStr += functionBuilder(node.left, node, '', field, negateLeftExp);
            }

            if (OR_MAPPING[node.operator]) fnStr += ' || ';
            if (AND_MAPPING[node.operator]) fnStr += ' && ';

            if (node.right) {
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

        strFnArgs.push('data', `return ${fnStr}`);

        try {
            const strFilterFunction = new Function(...strFnArgs);
            this.filterFn = (data:object) => strFilterFunction(...argsFns, data);
        } catch (err) {
            throw new Error(`error while attempting to build filter function \n\n new function components: ${strFnArgs} \n\nerror: ${err.message}`);
        }
    }

    private _parseRange(node:ast, topFieldName:string, isNegation:Boolean):string {
        let {
            inclusive_min: incMin,
            inclusive_max: incMax,
            term_min: minValue,
            term_max: maxValue,
            field = topFieldName
        } = node;
        let resultStr = ''
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
                resultStr = `data.${field} > ${minValue}`;
            } else {
                resultStr = `((${maxValue} >= data.${field}) && (data.${field}> ${minValue}))`
            }
        }
        // ie age:<10 || age:(<=10 AND >20)
        if (incMin && !incMax) {
            if (minValue === -Infinity) {
                resultStr = `data.${field} < ${maxValue}`;
            } else {
                resultStr =  `((${minValue} <= data.${field}) && (data.${field} < ${maxValue}))`;
            }
        }

        // ie age:<=10, age:>=10, age:(>=10 AND <=20)
        if (incMin && incMax) {
            if (maxValue === Infinity) {
                resultStr = `data.${field} >= ${minValue}`;
            } else if (minValue === -Infinity) {
                resultStr = `data.${field} <= ${maxValue}`;
            } else {
                resultStr = `((${maxValue} >= data.${field}) && (data.${field} >= ${minValue}))`;
            }
        }

        // ie age:(>10 AND <20)
        if (!incMin && !incMax) {
            resultStr = `((${maxValue} > data.${field}) && (data.${field} > ${minValue}))`;
        }

        if (isNegation) return `!(${resultStr})`
        return resultStr;
    }

    public match(doc:object) {
        const { types } = this;
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        const data = types.formatData(doc);
        return this.filterFn(data);
    }
}
