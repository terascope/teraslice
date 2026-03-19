import {
    isIP,
    isIPv6,
    isNonZeroCidr,
    inIPRange,
    isCIDR,
    IPAddress,
    CIDRBlock,
    IPRange,
} from '@terascope/ip-utils';
import { isInfiniteMin, isInfiniteMax, ParsedRange } from 'xlucene-parser';
import { getTypeOf, isString } from '@terascope/core-utils';
import { MatchValueFn } from './interfaces.js';

const MIN_IPV4_IP = '0.0.0.0';
const MAX_IPV4_IP = '255.255.255.255';

const MIN_IPV6_IP = '::';
const MAX_IPV6_IP = 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff';

export function ipTermOrThrow(value: unknown) {
    const argCidr = isString(value) ? isCIDR(value) : false;

    if (argCidr) {
        const cidr = CIDRBlock.of(`${value}`);
        const range = IPRange.from(cidr.first(), cidr.last());
        return pRangeTerm(range, true);
    }

    return isIPTerm(value, true);
}

export function ipTerm(value: unknown): MatchValueFn {
    const argCidr = isString(value) ? isCIDR(value) : false;

    if (argCidr) {
        const cidr = CIDRBlock.of(`${value}`);
        const range = IPRange.from(cidr.first(), cidr.last());
        return pRangeTerm(range, false);
    }

    return isIPTerm(value, false);
}

export function ipInRange(value: unknown) {
    if (value == null || !isIP(value)) {
        return () => false;
    }

    return (cidr: unknown) => {
        if (isCIDR(cidr)) {
            return inIPRange(value, { cidr });
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
            throw new TypeError(
                `Expected string for IP term match, got ${ip} (${getTypeOf(ip)})`,
            );
        }

        if (isNonZeroCidr(ip as any)) {
            return inIPRange(value, { cidr: ip as any });
        }

        // @ts-expect-error due to need for type narrowing
        return IPAddress.of(ip).compare(IPAddress.of(value)) === 0;
    };
}

function buildIPRange(rangeQuery: ParsedRange): IPRange {
    const incMin = rangeQuery.gte != null;
    const incMax = rangeQuery.lte != null;

    let minValue = `${rangeQuery.gte || rangeQuery.gt || '*'}`;
    let maxValue = `${rangeQuery.lte || rangeQuery.lt || '*'}`;

    if (isInfiniteMin(minValue)) {
        minValue = isIPv6(maxValue) ? MIN_IPV6_IP : MIN_IPV4_IP;
    }

    if (isInfiniteMax(maxValue)) {
        maxValue = isIPv6(minValue) ? MAX_IPV6_IP : MAX_IPV4_IP;
    }

    const min = incMin
        ? IPAddress.of(minValue)
        : IPAddress.of(minValue).offset(1n);

    const max = incMax
        ? IPAddress.of(maxValue)
        : IPAddress.of(maxValue).offset(-1n);

    return IPRange.from(min, max);
}

function pRangeTerm(range: IPRange, shouldThrow: boolean): MatchValueFn {
    return function checkIP(ip) {
        if (ip == null) {
            return false;
        }

        if (shouldThrow && !isString(ip)) {
            throw new TypeError(
                `Expected string for IP Range match, got ${ip} (${getTypeOf(ip)})`,
            );
        }

        if (isNonZeroCidr(ip as any)) {
            return range.containsCIDR(CIDRBlock.of(ip as any));
        }

        if (isString(ip) && isIP(ip)) {
            return range.contains(IPAddress.of(ip));
        }

        return false;
    };
}

export function ipRange(rangeQuery: ParsedRange): MatchValueFn {
    const range = buildIPRange(rangeQuery);
    return pRangeTerm(range, false);
}

export function ipRangeOrThrow(rangeQuery: ParsedRange) {
    const range = buildIPRange(rangeQuery);
    return pRangeTerm(range, true);
}
