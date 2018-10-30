'use strict';

import _ from 'lodash';
import LuceneQueryParser from '../lucene-query-parser';
import TypeManger from './type-manager';
import { bindThis, ast } from '../utils';

export default class DocumentMatcher extends LuceneQueryParser {
    private filterFn: Function|undefined;
    private types: TypeManger;

    // TODO: chang the any on typeConfig
    constructor(luceneStr?: string, typeConfig?:any) {
        super();
        this.types = new TypeManger(typeConfig);
        bindThis(this, DocumentMatcher);

        if (luceneStr) {
            this.parse(luceneStr);
            this._buildFilterFn();
        }
    }

    public parse(luceneStr: string, typeConfig?: any) {
        if (typeConfig) {
            this.types = new TypeManger(typeConfig);
        }
        super.parse(luceneStr);
        this._buildFilterFn();
    }

    private _buildFilterFn() {
        const { _ast: ast, types, _parseRange: parseRange } = this;
        let fnStrBody = '';
        let addParens = false;
        const parensDepth = {};

        const parsedAst = types.processAst(ast);
        console.log('the whole ast', JSON.stringify(ast, null, 4))

        function strBuilder(ast:ast, field:string, depth:number) {
            if (field && ast.term) {
                if (field === '_exists_') {
                    fnStrBody += `data.${ast.term} != null`;
                } else if (field === '__parsed') {
                    fnStrBody += `${ast.term}`;
                } else {
                    fnStrBody += `data.${field} == "${ast.term}"`;
                }
            }
            if (ast.term_min) {
                fnStrBody += parseRange(ast, field);
            }

            if (ast.operator) {
                let opStr = ' || ';

                if (ast.operator === 'AND') {
                    opStr = ' && ';
                    // only add a () around deeply recursive structures
                    if ((ast.right && (ast.right.left || ast.right.right)) || (ast.left && (ast.left.left || ast.left.right))) {
                        addParens = true;
                        opStr = ' && (';
                        parensDepth[depth] = true;
                    }
                }
                fnStrBody += opStr;
            }
        }

        function postParens(_ast:ast, _field:string, depth:number) {
            if (addParens && parensDepth[depth]) {
                addParens = false;
                fnStrBody += ')';
            }
        }

        this.walkLuceneAst(strBuilder, postParens, parsedAst);

        const argsObj = types.injectTypeFilterFns();
        const argsFns: Function[] = [];
        const strFnArgs:string[] = [];

        _.forOwn(argsObj, (value, key) => {
            strFnArgs.push(key);
            argsFns.push(value);
        });

        strFnArgs.push('data', `return ${fnStrBody}`);
        console.log('what is the body', strFnArgs)
        try {
            const strFilterFunction = new Function(...strFnArgs);
            this.filterFn = (data:object) => strFilterFunction(...argsFns, data);
        } catch (err) {
            throw new Error(`error while attempting to build filter function \n\n new function components: ${strFnArgs} \n\nerror: ${err.message}`);
        }
    }

    private _parseRange(node:ast, topFieldName:string):string {
        let {
            inclusive_min: incMin,
            inclusive_max: incMax,
            term_min: minValue,
            term_max: maxValue,
            field = topFieldName
        } = node;

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
                return `data.${field} > ${minValue}`;
            }
            return  `((${maxValue} >= data.${field}) && (data.${field}> ${minValue}))`;
        }
        // ie age:<10 || age:(<=10 AND >20)
        if (incMin && !incMax) {
            if (minValue === -Infinity) {
                return `data.${field} < ${maxValue}`;
            }
            return  `((${minValue} <= data.${field}) && (data.${field} < ${maxValue}))`;
        }

        // ie age:<=10, age:>=10, age:(>=10 AND <=20)
        if (incMin && incMax) {
            if (maxValue === Infinity) {
                return `data.${field} >= ${minValue}`;
            }
            if (minValue === -Infinity) {
                return `data.${field} <= ${maxValue}`;
            }
            return  `((${maxValue} >= data.${field}) && (data.${field} >= ${minValue}))`;
        }

        // ie age:(>10 AND <20)
        if (!incMin && !incMax) {
            return  `((${maxValue} > data.${field}) && (data.${field} > ${minValue}))`;
        }
        return '';
    }

    public match(doc:object) {
        const { types } = this;
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        const data = types.formatData(doc);
        return this.filterFn(data);
    }
}
