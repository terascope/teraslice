'use strict';

const LuceneQueryParser = require('../lucene-query-parser');
const { bindThis } = require('../utils');
const isCidr = require('is-cidr');
const { isIPv4, isIPv6 } = require('net');
const ip6addr = require('ip6addr');

class DocumentMatcher extends LuceneQueryParser {
    constructor(luceneStr, typeConfig) {
        super();
        this.luceneQuery = luceneStr;
        this.filterFn = null;
        this.types = null;
        this.ipFieldName = null;
        if (typeConfig) {
            for (const key in typeConfig) {
                if (typeConfig[key] === 'ip' ) {
                    this.ipFieldName = key;
                }
            }
            this.types = typeConfig
        }
        bindThis(this, DocumentMatcher);
        if (luceneStr) {
            this.parse(luceneStr);
            this.buildFilterFn();
        };
    }

    parse(luceneStr, typeConfig) {
        if (typeConfig) {
            for (const key in typeConfig) {
                if (typeConfig[key] === 'ip' ) {
                    this.ipFieldName = key;
                }
            }
            this.types = typeConfig
        }
        this.luceneQuery = luceneStr;
        super.parse(luceneStr);
        this.buildFilterFn();
    }

    _setUpIpFilter() {
        const { ipFieldName } = this;
        const fns = [];
        function populateIpQueries(node, fieldName){
            if(fieldName === ipFieldName) {
               if (node.term) {
                   const argeCidr = isCidr(node.term);
                   console.log('the argeCidr', argeCidr, node)
                   if (argeCidr > 0) {
                       const range = ip6addr.createCIDR(node.term);
                       //This needs to be dynamic
                        fns.push((ip) => {
                            console.log(' the incoming ip', ip, isCidr(ip) > 0)
                            if (isCidr(ip) > 0) {
                                const argRange = ip6addr.createCIDR(ip);
                                const argFirst = argRange.first().toString();
                                const argLast = argRange.last().toString();
                                const rangeFirst = range.first().toString();
                                const rangeLast = range.last().toString();
                                return (range.contains(argFirst) || range.contains(argLast) || argRange.contains(rangeFirst) || argRange.contains(rangeLast))
                            }
                            return range.contains(ip);
                        });
                        return;
                    }

                    return fns.push((ip) => {
                        if (isCidr(ip) > 0) {
                            const argRange = ip6addr.createCIDR(ip);
                            return argRange.contains(node.term)
                        }
                        
                        return ip === node.term
                    });
               }
            }
        }

        this.walkLuceneAst(populateIpQueries)
        return (obj) => {
            console.log('the obj calling', obj, ipFieldName, fns[0].toString())
            const ipData = obj[ipFieldName];
            return fns.every((fn) => {
                console.log('is this calling every at all');
                try {
                    fn(ipData)
                }
                catch(err) {
                    console.log('why does this not work', err)
                }
                console.log('in the every', fn, ipData, fn(ipData))
                return fn(ipData) === true
            })
        }
    }

    buildFilterFn() {
        let str = '';
        let addParens = false;
        const { _setUpIpFilter, ipFieldName } = this;

        function strBuilder(ast, _field) {
            const topField = ast.field || _field;
            if (topField === ipFieldName) {
                str += `argsFn(data)`
            } else {
                if (ast.field && ast.term) {
                    if (ast.field === '_exists_') {
                        str += `data.${ast.term} != null`
                    } else {
                        str += `data.${ast.field} == "${ast.term}"`
                    }
                }
                if (ast.term_min) {
                    str += _parseRange(ast, topField)
                }
            }
    
            if (ast.operator) {
                let opStr = ' || ';
        
                if (ast.operator === 'AND') {
                    addParens = true;
                    opStr = ' && ('
                }
        
                str += opStr;
            }
            if (addParens) {
                addParens = false;
                str += ')'
            }
        }
    
        this.walkLuceneAst(strBuilder);

        console.log('the first main strFn', str)

        try {
            const strFilterFunction = new Function('data', 'argsFn', `
            console.log('what is this inside fn',${str});
           // if (argsFn) return (argsFn(data) && ${str});
            return ${str}`);
            //TODO: review this
            function ipFilterFunction() {
                const ipFilter = _setUpIpFilter();
                return (data) => {
                    console.log('the top stuff', data)
                    if (ipFilter(data)) return true;
                    return false;
                }

            }
            this.filterFn = ipFieldName ? (data) => strFilterFunction(data, ipFilterFunction()) : strFilterFunction
        } catch(err) {
            console.log('the error', err)
        }
    }


    //TODO: look into combining this with other walk of ast
    _normalizeTypes() {
        const { types, rawAst } = this;
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

    match(doc){
        //TODO: should meta data be set here about rule?
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        console.log('whats the incoming doc', doc)
        return this.filterFn(doc);
    }
}

module.exports = DocumentMatcher;
