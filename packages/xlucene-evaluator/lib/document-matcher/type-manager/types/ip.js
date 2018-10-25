'use strict';

const isCidr = require('is-cidr');
const { isIPv4, isIPv6 } = require('net');
const ip6addr = require('ip6addr');
const BaseType = require('./base');
const { bindThis } = require('../../../utils');

const MIN_IPV4_IP = '0.0.0.0';
const MAX_IPV4_IP = '255.255.255.255';

const MIN_IPV6_IP = '0.0.0.0.0.0.0.0';
const MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';

const fnBaseName = 'ipFn';

class IpType extends BaseType {
    constructor(ipFieldDict) {
        super();
        this.fields = ipFieldDict;
        bindThis(this, IpType);
    }

    processAst(ast) {
        const { fields } = this;
        const fns = {};
        //used to denote the various filter functions with fnBaseName
        let ipFnNum = 0;

        function populateIpQueries(node, _field) {
            const topField = node.field || _field;
            if (fields[topField]) {
                ipFnNum += 1;
               if (node.term) {
                   const argeCidr = isCidr(node.term);
                   if (argeCidr > 0) {
                       const range = ip6addr.createCIDR(node.term);
                       //This needs to be dynamic
                        fns[`${fnBaseName}${ipFnNum}`] = (ip) => {
                            if (isCidr(ip) > 0) {
                                const argRange = ip6addr.createCIDR(ip);
                                const argFirst = argRange.first().toString();
                                const argLast = argRange.last().toString();
                                const rangeFirst = range.first().toString();
                                const rangeLast = range.last().toString();
                                return (range.contains(argFirst) || range.contains(argLast) || argRange.contains(rangeFirst) || argRange.contains(rangeLast))
                            }
                            return range.contains(ip);
                        };
                    } else {
                        fns[`${fnBaseName}${ipFnNum}`] = (ip) => {

                            if (isCidr(ip) > 0) {
                                const argRange = ip6addr.createCIDR(ip);
                                return argRange.contains(node.term)
                            }
                            return ip === node.term
                        };
                    }
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
                        minValue = ip6addr.parse(minValue).offset(1).toString();
                        maxValue = ip6addr.parse(maxValue).offset(-1).toString();
                        range = ip6addr.createAddrRange(minValue, maxValue);
                    }

                    fns[`${fnBaseName}${ipFnNum}`] = (ip) => {
                        if (isCidr(ip) > 0) {
                            const argRange = ip6addr.createCIDR(ip);
                            const argFirst = argRange.first().toString();
                            const argLast = argRange.last().toString();
                            const rangeFirst = range.first().toString();
                            const rangeLast = range.last().toString();
                            return (range.contains(argFirst) || range.contains(argLast) || argRange.contains(rangeFirst) || argRange.contains(rangeLast))
                        }
                        return range.contains(ip);
                    };
               }

               return { field: '__parsed', term: `${fnBaseName}${ipFnNum}(data.${topField})`}
            }
            return node;
        }

        const parsedAst = this.walkAst(ast, populateIpQueries);
        //fns is set after walkAst is called
        this.typeFilterFn = fns;
        return parsedAst;
    }

    get injectTypeFilterFns() {
        return this.typeFilterFn;
    }

}

module.exports = IpType;
