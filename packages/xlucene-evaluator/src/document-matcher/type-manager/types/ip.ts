import isCidr from 'is-cidr';
// @ts-ignore TODO we should add types
import ip6addr from 'ip6addr';
import { isIPv6, isIP } from'net';
import BaseType from'./base';
import { bindThis, isInfiniteMin, isInfiniteMax, isRangeNode } from '../../../utils';
import { AST } from '../../../interfaces';

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

    processAst(ast: AST): AST {
        // tslint:disable-next-line no-this-assignment
        const { filterFnBuilder, createParsedField, fields } = this;

        function populateIpQueries(node: AST, _field?: string) {
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
                if (isRangeNode(node)) {
                    const {
                         inclusive_min: incMin,
                         inclusive_max: incMax,
                    } = node;

                    let minValue = node.term_min as string;
                    let maxValue = node.term_max as string;

                    if (isInfiniteMin(minValue)) isIPv6(maxValue) ? minValue = MIN_IPV6_IP : minValue = MIN_IPV4_IP;
                    if (isInfiniteMax(maxValue)) isIPv6(minValue) ? maxValue = MAX_IPV6_IP : maxValue = MAX_IPV4_IP;

                    if (!incMin) minValue = ip6addr.parse(minValue).offset(1).toString();
                    if (!incMax) maxValue = ip6addr.parse(maxValue).offset(-1).toString();
                    const range = ip6addr.createAddrRange(minValue, maxValue);

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

                return {
                    type: 'term',
                    field: '__parsed',
                    term: createParsedField(topField)
                };
            }
            return node;
        }

        return this.walkAst(ast, populateIpQueries);
    }
}
