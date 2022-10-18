import isCidr from 'is-cidr';
import ip6addr from 'ip6addr';
import isIP from 'is-ip';
import {
    isInfiniteMin, isInfiniteMax, ParsedRange
} from 'xlucene-parser';
import { getTypeOf, isString } from '@terascope/utils';
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

export function ipTerm(value: unknown): MatchValueFn {
    const argCidr = isString(value) ? isCidr(value) : false;
    if (argCidr) {
        const range = ip6addr.createCIDR(`${value}`);
        return pRangeTerm(range);
    }

    return function isIPTerm(ip) {
        if (ip == null) return false;
        if (!isString(ip)) {
            throw new TypeError(`Expected string for IP term match, got ${ip} (${getTypeOf(ip)})`);
        }
        if (isCidr(ip) > 0) {
            const argRange = ip6addr.createCIDR(ip);
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
        isIP.v6(maxValue) ? (minValue = MIN_IPV6_IP) : (minValue = MIN_IPV4_IP);
    }
    if (isInfiniteMax(maxValue)) {
        isIP.v6(minValue) ? (maxValue = MAX_IPV6_IP) : (maxValue = MAX_IPV4_IP);
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

function pRangeTerm(range: ip6addr.AddrRange): MatchValueFn {
    return function checkIP(ip) {
        if (ip == null) return false;
        if (!isString(ip)) {
            throw new TypeError(`Expected string for IP Range match, got ${ip} (${getTypeOf(ip)})`);
        }
        if (isCidr(ip) > 0) {
            return checkCidr(ip, range);
        }
        if (isIP(ip)) return range.contains(ip);
        return false;
    };
}

export function ipRange(rangeQuery: ParsedRange): MatchValueFn {
    const { minValue, maxValue } = validateIPRange(rangeQuery);
    const range = ip6addr.createAddrRange(minValue, maxValue);
    return pRangeTerm(range);
}
