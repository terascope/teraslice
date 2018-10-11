'use strict';

const LuceneQueryParser = require('../lucene-query-parser');
const { bindThis } = require('../utils');

class DocumentMatcher extends LuceneQueryParser {
    constructor(luceneStr, typeConfig) {
        super();
        this.luceneQuery = luceneStr;
        this.filterFn = null;
        this.types = typeConfig || null;
        bindThis(this, DocumentMatcher);
        if (luceneStr) {
            this.parse(luceneStr);
            this.buildFilterFn();
        };
    }

    parse(luceneStr) {
        this.luceneQuery = luceneStr;
        super.parse(luceneStr);
        this.buildFilterFn();
    }

    buildFilterFn() {
        const fnStr = this._walkLuceneAst(this.rawAst, '');
        try {
        this.filterFn = new Function('data', `return ${fnStr} ? true : false`);
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

        // ie age:>10 || age:(>=10 AND <20)
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

    // _field is used on fields that have deep recursive nodes to generate values
    // ie age:((>=10 AND <=20) OR >=100)
    _walkLuceneAst(ast, fnStr, _field) {
        let addParens = false;
        const topField = ast.field || _field;

        if (ast.field && ast.term) {
            if (ast.field === '_exists_') {
                fnStr += `data.${ast.term} != null`
            } else {
                fnStr += `data.${ast.field} == "${ast.term}"`
            }
        }
    
        if (ast.term_min) {
            fnStr += this._parseRange(ast, topField)
        }
    
        if (ast.left) {
            fnStr += this._walkLuceneAst(ast.left, '', topField);
        } 
    
        if (ast.operator) {
            let opStr = ' || ';
    
            if (ast.operator === 'AND') {
                addParens = true;
                opStr = ' && ('
            }
    
            fnStr += opStr;
        }
    
        if (ast.right) {
            fnStr += this._walkLuceneAst(ast.right, '', topField);
            if (addParens) {
                addParens = false;
                fnStr += ')'
            }
        } 
    
        return fnStr;
    }

    match(doc){
        //TODO: should meta data be set here about rule?
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        return this.filterFn(doc);
    }
}

module.exports = DocumentMatcher;
