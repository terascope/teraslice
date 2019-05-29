import isCidr from 'is-cidr';
// @ts-ignore TODO we should add types
import ip6addr from 'ip6addr';
import { isIPv6, isIP } from 'net';
import { getRangeValues } from './dates';
import { isInfiniteMin, isInfiniteMax } from '../../utils';
import { Term, Range } from '../../parser';
const MIN_IPV4_IP = '0.0.0.0';
const MAX_IPV4_IP = '255.255.255.255';

const MIN_IPV6_IP = '::';
const MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';

export function ipTerm(node: Term) {
    const argeCidr = isCidr(node.value as string);
    if (argeCidr > 0) {
        const range = ip6addr.createCIDR(node.value);
        return pRangeTerm(range);
    }

    return function isIpterm(ip: string) {
        if (isCidr(ip) > 0) {
            const argRange = ip6addr.createCIDR(ip);
            return argRange.contains(node.value);
        }
        return ip === node.value;
    };
}

function validateIpRange(node: Range) {
    // tslint:disable-next-line
    let { incMin, incMax, minValue, maxValue } = getRangeValues(node);

    if (isInfiniteMin(minValue)) isIPv6(maxValue as string) ? (minValue = MIN_IPV6_IP) : (minValue = MIN_IPV4_IP);
    if (isInfiniteMax(maxValue)) isIPv6(minValue as string) ? (maxValue = MAX_IPV6_IP) : (maxValue = MAX_IPV4_IP);

    if (!incMin) {
        minValue = ip6addr
            .parse(minValue)
            .offset(1)
            .toString();
    }
    if (!incMax) {
        maxValue = ip6addr
            .parse(maxValue)
            .offset(-1)
            .toString();
    }
    return { minValue, maxValue };
}

function checkCidr(ip: string, range: any) {
    const argRange = ip6addr.createCIDR(ip);
    return (
        range.contains(argRange.first().toString()) ||
        range.contains(argRange.last().toString()) ||
        argRange.contains(range.first().toString()) ||
        argRange.contains(range.last().toString())
    );
}

function pRangeTerm(range: any) {
    return function checkIp(ip: string) {
        if (isCidr(ip) > 0) {
            return checkCidr(ip, range);
        }
        if (isIP(ip) > 0) return range.contains(ip);
        return false;
    };
}

export function ipRange(node: Range) {
    const { minValue, maxValue } = validateIpRange(node);
    const range = ip6addr.createAddrRange(minValue, maxValue);
    return pRangeTerm(range);
}
