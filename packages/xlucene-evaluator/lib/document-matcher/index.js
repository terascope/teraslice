'use strict';

const _ = require('lodash');

const LuceneQueryParser = require('../lucene-query-parser');
const { bindThis } = require('../utils');
const TypeManger = require('./type-manager');

class DocumentMatcher extends LuceneQueryParser {
    constructor(luceneStr, typeConfig) {
        super();
        this.luceneQuery = luceneStr;
        this.filterFn = null;
        this.types = new TypeManger(typeConfig);
    
        bindThis(this, DocumentMatcher);

        if (luceneStr) {
            this.parse(luceneStr);
            this._buildFilterFn();
        };
    }

    parse(luceneStr, typeConfig) {
        if (typeConfig) {
            this.types = new TypeManger(typeConfig);
        }
        this.luceneQuery = luceneStr;
        super.parse(luceneStr);
        this._buildFilterFn();
    }

    _buildFilterFn() {
        let fnStrBody = '';
        let addParens = false;
        let parensDepth = {};
        //TODO: change this
        const self = this; 
        let regexField = null;
        const { _ast: ast, types } = this;

        let parsedAst = types.processAst(ast);
        this._parsedAst = parsedAst;

        if (types) {
            for (const key in types) {
        
                if (types[key] === 'regex' ) {
                    regexField = key;
                }
            }
        }

        function strBuilder(ast, _field, depth) {
            const topField = ast.field || _field;

            if (regexField && (topField === regexField)) {
                fnStrBody += `data.${ast.field}.match(/^(${ast.term})\\b/) !== null`
            } else {
                if (ast.field && ast.term) {
                    if (ast.field === '_exists_') {
                        fnStrBody += `data.${ast.term} != null`;
                    } else if (ast.field === '__parsed') {
                        fnStrBody += `${ast.term}`;
                    } else {
                        fnStrBody += `data.${ast.field} == "${ast.term}"`
                    }
                }
                if (ast.term_min) {
                    fnStrBody += self._parseRange(ast, topField)
                }
            }
    
            if (ast.operator) {
                let opStr = ' || ';
        
                if (ast.operator === 'AND') {
                    //console.log('what is the ast here', ast)
                    opStr = ' && '
                    //only add a () around deeply recursive structures
                    if ((ast.right && (ast.right.left || ast.right.right)) || (ast.left && (ast.left.left || ast.left.right))) {
                        addParens = true;
                        opStr = ' && ('
                        parensDepth[depth] = true;
                    }
                }
        
                fnStrBody += opStr;
            }
           
        }

        function postParens(ast, _field, depth) {
            if (addParens && parensDepth[depth]) {
                addParens = false;
                fnStrBody += ')'
            }
        }

        this.walkLuceneAst(strBuilder, postParens, parsedAst);

        console.log('the first main strFn', fnStrBody)

        try {
            const argsObj = types.injectTypeFilterFns();
            const argsFns = [];
            const strFnArgs = [];

            _.forOwn(argsObj, (value, key) => {
                strFnArgs.push(key);
                argsFns.push(value)
            });

            strFnArgs.push('data', `return ${fnStrBody}`);

            const strFilterFunction = new Function(...strFnArgs);
            this.filterFn = (data) => strFilterFunction(...argsFns, data)
        } catch(err) {
            console.log('the error', err)
        }
    }

    _parseRange(node, topFieldName) {
        let {
            inclusive_min: incMin,
            inclusive_max: incMax,
            term_min: minValue,
            term_max: maxValue,
            field = topFieldName
        } = node;

        if (minValue === '*') minValue = -Infinity;
        if (maxValue === '*') maxValue = Infinity;

        // ie age:>10 || age:(>10 AND <=20)
        if (!incMin && incMax) {
            if (maxValue === Infinity) {
                return `data.${field} > ${minValue}`
            }
           return  `((${maxValue} >= data.${field}) && (data.${field}> ${minValue}))`
        }
        // ie age:<10 || age:(<=10 AND >20)
        if (incMin && !incMax) {
            if (minValue === -Infinity) {
                return `data.${field} < ${maxValue}`
            }
           return  `((${minValue} <= data.${field}) && (data.${field} < ${maxValue}))`
        }
    
        // ie age:<=10, age:>=10, age:(>=10 AND <=20)
        if (incMin && incMax) {
            if (maxValue === Infinity) {
                return `data.${field} >= ${minValue}`
            }
            if (minValue === -Infinity) {
                return `data.${field} <= ${maxValue}`
            }
           return  `((${maxValue} >= data.${field}) && (data.${field} >= ${minValue}))`
        }

        // ie age:(>10 AND <20)
        if(!incMin && !incMax) {
            return  `((${maxValue} > data.${field}) && (data.${field} > ${minValue}))`
        }
    }

    match(doc) {
        //TODO: should meta data be set here about rule?
        const { types } = this;
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        const data = types.formatData(doc);
        return this.filterFn(data);
    }
}

module.exports = DocumentMatcher;
