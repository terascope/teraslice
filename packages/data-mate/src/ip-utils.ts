import isCidr from 'is-cidr';
import ip6addr from 'ip6addr';
import IPCIDR from 'ip-cidr';
import { IpAddress } from 'cidr-calc';
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
        const range = new IPCIDR(`${value}`);
        return pRangeTerm(range, true);
    }

    return isIPTerm(value, true);
}

export function ipTerm(value: unknown): MatchValueFn {
    const argCidr = isString(value) ? isCidr(value) : false;

    if (argCidr) {
        const range = new IPCIDR(`${value}`);
        return pRangeTerm(range, false);
    }

    return isIPTerm(value, false);
}

export function ipInRange(value: unknown) {
    if (value == null || !isIP(value)) {
        return () => false;
    }

    const addr = IpAddress.of(value).toString();

    return (input: unknown) => {
        if (isString(input) && isCidr(input)) {
            return new IPCIDR(input).contains(addr);
        }

        return false;
    };
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
            const argRange = new IPCIDR(`${ip}`);
            return argRange.contains(`${value}`);
        }

        // @ts-expect-error due to need for type narrowing
        return IpAddress.of(ip).toString() === IpAddress.of(value).toString();
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

function checkCidr(ip: string, range: ip6addr.AddrRange & IPCIDR) {
    const argRange = new IPCIDR(`${ip}`);
    const { first, last } = getFirstAndLastIp(range);

    return (
        range.contains(argRange.start())
        || range.contains(argRange.end())
        || argRange.contains(first)
        || argRange.contains(last)
    );
}

function getFirstAndLastIp(range: ip6addr.AddrRange & IPCIDR) {
    if (range instanceof IPCIDR) {
        const [first, last] = range.toRange();
        return { first, last };
    }

    return {
        // @ts-expect-error
        first: range.first ? range.first().toString() : range._begin.toString(),
        // @ts-expect-error
        last: range.end ? range.end().toString() : range._end.toString()
    };
}

function pRangeTerm(range: ip6addr.AddrRange | IPCIDR, shouldThrow: boolean): MatchValueFn {
    return function checkIP(ip) {
        if (ip == null) {
            return false;
        }

        if (shouldThrow && !isString(ip)) {
            throw new TypeError(`Expected string for IP Range match, got ${ip} (${getTypeOf(ip)})`);
        }

        if (isNonZeroCidr(ip as any)) {
            return checkCidr(ip as any, range as any);
        }

        if (isString(ip) && isIP(ip)) {
            const ipData = IpAddress.of(ip).toString();
            return range.contains(ipData);
        }

        return false;
    };
}

function createRange(rangeQuery: ParsedRange) {
    const { minValue, maxValue } = validateIPRange(rangeQuery);

    const min = IpAddress.of(minValue).toString();
    const max = IpAddress.of(maxValue).toString();

    return ip6addr.createAddrRange(min, max);
}

export function ipRange(rangeQuery: ParsedRange): MatchValueFn {
    const range = createRange(rangeQuery);
    return pRangeTerm(range, false);
}

export function ipRangeOrThrow(rangeQuery: ParsedRange) {
    const range = createRange(rangeQuery);
    return pRangeTerm(range, true);
}
