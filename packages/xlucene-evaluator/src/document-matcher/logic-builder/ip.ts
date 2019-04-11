import isCidr from 'is-cidr';
// @ts-ignore TODO we should add types
import ip6addr from 'ip6addr';
import { isIPv6, isIP } from'net';
import { isInfiniteMin, isInfiniteMax, parseRange } from '../../utils';
import { Term, Range } from '../../parser';
const MIN_IPV4_IP = '0.0.0.0';
const MAX_IPV4_IP = '255.255.255.255';

const MIN_IPV6_IP = '::';
const MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';

export function ipTerm(node: Term) {
    const argeCidr = isCidr(node.value as string);
    if (argeCidr > 0) {
        const range = ip6addr.createCIDR(node.value);

        return function isCidrIpTerm(ip: string) {
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
        };
    }

    return function isIpterm(ip: string) {
        if (isCidr(ip) > 0) {
            const argRange = ip6addr.createCIDR(ip);
            return argRange.contains(node.value);
        }
        return ip === node.value;
    };
}

export function ipRange(node: Range) {
    const rangeQuery = parseRange(node);
    const incMin = rangeQuery.gte != null;
    const incMax = rangeQuery.lte != null;
    let minValue = rangeQuery.gte || rangeQuery.gt || '*';
    let maxValue = rangeQuery.lte || rangeQuery.lt || '*';

    if (isInfiniteMin(minValue)) isIPv6(maxValue as string) ? minValue = MIN_IPV6_IP : minValue = MIN_IPV4_IP;
    if (isInfiniteMax(maxValue)) isIPv6(minValue as string) ? maxValue = MAX_IPV6_IP : maxValue = MAX_IPV4_IP;

    if (!incMin) minValue = ip6addr.parse(minValue).offset(1).toString();
    if (!incMax) maxValue = ip6addr.parse(maxValue).offset(-1).toString();
    const range = ip6addr.createAddrRange(minValue, maxValue);

    return function pRangeTerm(ip: string) {
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
    };
}
