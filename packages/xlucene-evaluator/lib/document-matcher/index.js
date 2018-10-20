'use strict';

const LuceneQueryParser = require('../lucene-query-parser');
const { bindThis } = require('../utils');
const isCidr = require('is-cidr');
const { isIPv4, isIPv6 } = require('net');
const ip6addr = require('ip6addr');
const _ = require('lodash');

const MIN_IPV4_IP = '0.0.0.0';
const MAX_IPV4_IP = '255.255.255.255';

const MIN_IPV6_IP = '0.0.0.0.0.0.0.0';
const MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';

//TODO: need regex capability, dates, geo
//TODO: need to handle obj with multiple ip, date type keys etc
class DocumentMatcher extends LuceneQueryParser {
    constructor(luceneStr, typeConfig) {
        super();
        this.luceneQuery = luceneStr;
        this.filterFn = null;
        this.types = null;
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

                    fns.push((ip) => {
                        if (isCidr(ip) > 0) {
                            const argRange = ip6addr.createCIDR(ip);
                            return argRange.contains(node.term)
                        }
                        
                        return ip === node.term
                    });
                    return;
               }
               // RANGE EXPRESSIONS
               if (node.term_max !== undefined) {

                    let {
                        inclusive_min: incMin,
                        inclusive_max: incMax,
                        term_min: minValue,
                        term_max: maxValue,
                        field = topFieldName
                    } = node;
                    let range;
                    console.log('what is node here', node, minValue, maxValue)

            
                    if (minValue === '*') isIPv6(maxValue) ? minValue = MIN_IPV6_IP : minValue = MIN_IPV4_IP;
                    if (maxValue === '*') isIPv6(minValue) ? maxValue = MAX_IPV6_IP : maxValue = MAX_IPV4_IP;
            
                    // ie ip:{ 0.0.0.0 TO *] ||  ip:{0.0.0.0 TO 1.1.1.1]
                    if (!incMin && incMax) {
                        minValue = ip6addr.parse(minValue).offset(1).toString();
                        range = ip6addr.createAddrRange(minValue, maxValue);
                    }
                    // ie age:<10 || age:(<=10 AND >20)
                    if (incMin && !incMax) {
                        maxValue = ip6addr.parse(maxValue).offset(-1).toString();
                        range = ip6addr.createAddrRange(minValue, maxValue);
                    }
                
                    // ie age:<=10, age:>=10, age:(>=10 AND <=20)
                    if (incMin && incMax) {
                        range = ip6addr.createAddrRange(minValue, maxValue);
                    }
            
                    // ie age:(>10 AND <20)
                    if(!incMin && !incMax) {
                        console.log('what is nodezzzzz', node, minValue)
                        minValue = ip6addr.parse(minValue).offset(1).toString();
                        maxValue = ip6addr.parse(maxValue).offset(-1).toString();
                        range = ip6addr.createAddrRange(minValue, maxValue);
                    }

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
               }
            }
        }

        this.walkLuceneAst(populateIpQueries)
        return (obj) => {
            const ipData = obj[ipFieldName];
            return fns.every((fn) => {
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
        let parensDepth = {};
        const { _setUpIpFilter, ipFieldName, types } = this;
        //TODO: change this
        const self = this; 
        const preprocess = {};
        let hasDateTypes = false;
        let hasGeoTypes = false;
        let geoQuery = null;
        let parsedAst = null;

        const { _ast: ast } = this;


        if (types) {
            for (const key in types) {
                if (types[key] === 'date' ) {
                    hasDateTypes = true;
                    preprocess[key] = types[key];
                }
                if (types[key] === 'geo' ) {
                    hasGeoTypes = true;
                }
            }
        }

        //TODO: is geo_sort_unit correct name for units?
        const geoParameters = {
            _geo_point_: 'geoPoint',
            _geo_distance_: 'geoDistance',
            _geo_box_top_left_: 'geoBoxTopLeft',
            _geo_box_bottom_right_: 'geoBoxBottomRight',
            _geo_sort_unit_: 'geoSortUnit'
        };
        const geoResults = {};

        // geo_field: geoField,
        // geo_box_top_left: geoBoxTopLeft,
        // geo_box_bottom_right: geoBoxBottomRight,
        // geo_point: geoPoint,
        // geo_distance: geoDistance,
        // geo_sort_point: geoSortPoint,
        // geo_sort_order: geoSortOrder,
        // geo_sort_unit: geoSortUnit
        //TODO: dont mutate raw ast, have another one

        function parseGeoQueries(node){
            //console.log('parseGeoQueries is calling', node, !geoResults['geoField'], _.get(node, 'left.field'), geoParameters[_.get(node, 'left.field')])
            if (!geoResults['geoField'] && (geoParameters[_.get(node, 'right.field')] || geoParameters[_.get(node, 'left.field')])) {
                geoResults['geoField'] = node.field
            }

            if (geoParameters[node.field]) {
                geoResults[geoParameters[node.field]] = node.term
            }
        }


        if (hasDateTypes) {
            this.walkLuceneAst(parseDates);
        }

        function makeGeoQueryFn() {
            return (data) => {
                console.log('im in the geoWueryfn', data)
                return true;
            }
        }

        if (hasGeoTypes) {
            this.walkLuceneAst(parseGeoQueries);
            if (Object.keys(geoResults).length > 0) {
                geoQuery = makeGeoQueryFn(geoResults)
                const clone = _.cloneDeep(ast);
                function alterCloneAst(node){
                    if (node.field === geoResults['geoField']) {
                        return { field: '__parsed', term: 'geoFn(data)'};
                    }
                    return node
                }
                
                function alterAst(ast) {
                    //const results = alterCloneAst(ast);
                
                    function walk(ast){
                        const node = alterCloneAst(ast);
                
                        if (node.right) {
                            node.right = walk(node.right)
                        }
                
                        if (node.left) {
                            node.left = walk(node.left)
                        }
                        return node;
                    }
                
                   return walk(ast)
                  // return results;
                }
    
                parsedAst = alterAst(clone);
            }
        }

        function parseDates(node, _field, depth) {
            const topField = node.field || _field;

            function convert(value){
                const results = new Date(value).getTime();
                if (results) return results;
                return value;
            }

            if (preprocess[topField]) {
                if (node.term) node.term = convert(node.term);
                if (node.term_max) node.term_max = convert(node.term_max);
                if (node.term_min) node.term_min = convert(node.term_min);
                console.log('is parseDates running', node)

            }
        }

        function strBuilder(ast, _field, depth) {
            const topField = ast.field || _field;

            if (topField === ipFieldName) {
                str += `argsFn(data)`
            } else {
                if (ast.field && ast.term) {
                    if (ast.field === '_exists_') {
                        str += `data.${ast.term} != null`;
                    } else if (ast.field === '__parsed') {
                        str += `${ast.term}`;
                    } else {
                        str += `data.${ast.field} == "${ast.term}"`
                    }
                }
                if (ast.term_min) {
                    str += self._parseRange(ast, topField)
                }
            }
    
            if (ast.operator) {
                let opStr = ' || ';
        
                if (ast.operator === 'AND') {
                    console.log('what is the ast here', ast)
                    opStr = ' && '
                    //only add a () around deeply recursive structures
                    if ((ast.right && (ast.right.left || ast.right.right)) || (ast.left && (ast.left.left || ast.left.right))) {
                        addParens = true;
                        opStr = ' && ('
                        parensDepth[depth] = true;
                    }
                }
        
                str += opStr;
            }
           
        }

        function postParens(ast, _field, depth) {
            if (addParens && parensDepth[depth]) {
                addParens = false;
                str += ')'
            }
        }
        console.log('the parsedAst', JSON.stringify(parsedAst, null, 4))
        this.walkLuceneAst(strBuilder, postParens, parsedAst);

        console.log('the first main strFn', str)

        try {
            const strFilterFunction = new Function('data', 'argsFn', 'geoFn',`
            console.log('what is this inside fn',${str});
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

            console.log('should be calling the extra speciall way', ipFieldName, geoQuery, (ipFieldName || geoQuery))
            this.filterFn = (ipFieldName || geoQuery) ? (data) => strFilterFunction(data, ipFilterFunction(), geoQuery) : strFilterFunction
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
    //TODO: this should be a pipeline
    _preprocessData(data){
        const { types } = this;
        for (const key in types) {
            if (types[key] === 'date' ) {
                if (data[key]) {
                    data[key] = new Date(data[key]).getTime();
                }
            }
        }
        return data;
    }

    match(doc) {
        //TODO: should meta data be set here about rule?
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        const data = this._preprocessData(doc);
        console.log('the parsed incomfing data', data)
        return this.filterFn(data);
    }
}

module.exports = DocumentMatcher;
