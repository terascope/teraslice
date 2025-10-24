import isCidr from 'is-cidr';
import ip6addr from 'ip6addr';
import { isIP, isIPv6, isNonZeroCidr } from '@terascope/ip-utils';
import { isInfiniteMin, isInfiniteMax, ParsedRange } from 'xlucene-parser';
import { getTypeOf, isString } from '@terascope/core-utils';
import { MatchValueFn } from './interfaces.js';

const MIN_IPV4_IP = '0.0.0.0';
const MAX_IPV4_IP = '255.255.255.255';

const MIN_IPV6_IP = '::';
const MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';

function getRangeValues(rangeQuery: ParsedRange): {
    incMin: boolean;
    incMax: boolean;
    minValue: string;
    maxValue: string;
} {
    const incMin = rangeQuery.gte != null;
    const incMax = rangeQuery.lte != null;
    const minValue = `${rangeQuery.gte || rangeQuery.gt || '*'}`;
    const maxValue = `${rangeQuery.lte || rangeQuery.lt || '*'}`;

    return {
        incMin, incMax, minValue, maxValue
    };
}

export function ipTermOrThrow(value: unknown) {
    const argCidr = isString(value) ? isCidr(value) : false;

    if (argCidr) {
        const range = ip6addr.createCIDR(`${value}`);
        return pRangeTerm(range, true);
    }

    return isIPTerm(value, true);
}

export function ipTerm(value: unknown): MatchValueFn {
    const argCidr = isString(value) ? isCidr(value) : false;

    if (argCidr) {
        const range = ip6addr.createCIDR(`${value}`);
        return pRangeTerm(range, false);
    }

    return isIPTerm(value, false);
}

function isIPTerm(value: unknown, shouldThrow: boolean) {
    return function _isIPTerm(ip: unknown) {
        if (ip == null) {
            return false;
        }

        if (shouldThrow && !isString(ip)) {
            throw new TypeError(`Expected string for IP term match, got ${ip} (${getTypeOf(ip)})`);
        }

        if (isNonZeroCidr(ip as any)) {
            const argRange = ip6addr.createCIDR(ip as any);
            return argRange.contains(`${value}`);
        }

        return ip === value;
    };
}

function validateIPRange(rangeQuery: ParsedRange) {
    const values = getRangeValues(rangeQuery);
    const { incMin, incMax } = values;
    let { minValue, maxValue } = values;

    if (isInfiniteMin(minValue)) {
        if (isIPv6(maxValue)) {
            minValue = MIN_IPV6_IP;
        } else {
            minValue = MIN_IPV4_IP;
        }
    }

    if (isInfiniteMax(maxValue)) {
        if (isIPv6(minValue)) {
            maxValue = MAX_IPV6_IP;
        } else {
            maxValue = MAX_IPV4_IP;
        }
    }

    if (!incMin) {
        const parsed = ip6addr.parse(minValue).offset(1);
        if (!parsed) throw new Error(`Invalid min IP value ${minValue}`);
        minValue = parsed.toString();
    }

    if (!incMax) {
        const parsed = ip6addr.parse(maxValue).offset(-1);
        if (!parsed) throw new Error(`Invalid max IP value ${maxValue}`);
        maxValue = parsed.toString();
    }

    return { minValue, maxValue };
}

function checkCidr(ip: string, range: ip6addr.AddrRange) {
    const argRange = ip6addr.createCIDR(ip);
    return (
        range.contains(argRange.first().toString())
        || range.contains(argRange.last().toString())
        || argRange.contains(range.first().toString())
        || argRange.contains(range.last().toString())
    );
}

function pRangeTerm(range: ip6addr.AddrRange, shouldThrow: boolean): MatchValueFn {
    return function checkIP(ip) {
        if (ip == null) {
            return false;
        }

        if (shouldThrow && !isString(ip)) {
            throw new TypeError(`Expected string for IP Range match, got ${ip} (${getTypeOf(ip)})`);
        }

        if (isNonZeroCidr(ip as any)) {
            return checkCidr(ip as any, range);
        }

        if (isIP(ip as any)) {
            return range.contains(ip as any);
        }

        return false;
    };
}

function createRange(rangeQuery: ParsedRange) {
    const { minValue, maxValue } = validateIPRange(rangeQuery);
    return ip6addr.createAddrRange(minValue, maxValue);
}

export function ipRange(rangeQuery: ParsedRange): MatchValueFn {
    const range = createRange(rangeQuery);
    return pRangeTerm(range, false);
}

export function ipRangeOrThrow(rangeQuery: ParsedRange) {
    const range = createRange(rangeQuery);
    return pRangeTerm(range, true);
}
