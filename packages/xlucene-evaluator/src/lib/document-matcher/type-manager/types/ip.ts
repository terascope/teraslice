
import isCidr from 'is-cidr';
import { isIPv6, isIP } from'net';
import ip6addr from 'ip6addr';
import BaseType from'./base';
import { bindThis, ast } from '../../../utils';

const MIN_IPV4_IP = '0.0.0.0';
const MAX_IPV4_IP = '255.255.255.255';

const MIN_IPV6_IP = '::';
const MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';

const fnBaseName = 'ipFn';

export default class IpType extends BaseType {
    private fields: object;

    constructor(ipFieldDict: object) {
        super(fnBaseName);
        this.fields = ipFieldDict;
        bindThis(this, IpType);
    }

    processAst(ast: ast): ast {
        const { filterFnBuilder, createParsedField, fields } = this;

        function populateIpQueries(node: ast, _field?: string) {
            const topField = node.field || _field;

            if (topField && fields[topField]) {
                if (node.term) {
                   const argeCidr = isCidr(node.term);
                   if (argeCidr > 0) {
                       const range = ip6addr.createCIDR(node.term);

                       filterFnBuilder((ip: string) => {
                           if (isCidr(ip) > 0) {
                                const argRange = ip6addr.createCIDR(ip);
                                const argFirst = argRange.first().toString();
                                const argLast = argRange.last().toString();
                                const rangeFirst = range.first().toString();
                                const rangeLast = range.last().toString();
                                return (range.contains(argFirst) || range.contains(argLast) || argRange.contains(rangeFirst) || argRange.contains(rangeLast));
                            }
                           if (isIP(ip) > 0) return range.contains(ip);
                           return false;
                       });
                   } else {
                       filterFnBuilder((ip: string) => {
                            if (isCidr(ip) > 0) {
                                const argRange = ip6addr.createCIDR(ip);
                                return argRange.contains(node.term);
                            }
                            return ip === node.term;
                        });
                   }
               }
               // RANGE EXPRESSIONS
                if (node.term_max !== undefined) {
                   let {
                        inclusive_min: incMin,
                        inclusive_max: incMax,
                        term_min: minValue,
                        term_max: maxValue
                    } = node;
                   let range;

                   if (minValue === '*' && typeof maxValue === 'string') isIPv6(maxValue) ? minValue = MIN_IPV6_IP : minValue = MIN_IPV4_IP;
                   if (maxValue === '*' && typeof minValue === 'string') isIPv6(minValue) ? maxValue = MAX_IPV6_IP : maxValue = MAX_IPV4_IP;

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
                   if (!incMin && !incMax) {
                        minValue = ip6addr.parse(minValue).offset(1).toString();
                        maxValue = ip6addr.parse(maxValue).offset(-1).toString();
                        range = ip6addr.createAddrRange(minValue, maxValue);
                    }

                    filterFnBuilder((ip: string) => {
                        if (isCidr(ip) > 0) {
                            const argRange = ip6addr.createCIDR(ip);
                            const argFirst = argRange.first().toString();
                            const argLast = argRange.last().toString();
                            const rangeFirst = range.first().toString();
                            const rangeLast = range.last().toString();
                            return (range.contains(argFirst) || range.contains(argLast) || argRange.contains(rangeFirst) || argRange.contains(rangeLast));
                        }
                        if (isIP(ip) > 0) return range.contains(ip);
                        return false;
                    });
               }

                return { field: '__parsed', term: createParsedField(topField) };
            }
            return node;
        }

        return this.walkAst(ast, populateIpQueries);
    }
}
