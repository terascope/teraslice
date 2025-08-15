import {
    isIP as _isIP, isIPv4 as _isIPv4,
    isIPv6 as _isIPv6, ipVersion as _ipVersion
} from '@chainsafe/is-ip';
import IPCIDR from 'ip-cidr';
import isCidr from 'is-cidr';
import ipaddr, { IPv4, IPv6 } from 'ipaddr.js';
import { parseIp, stringifyIp } from 'ip-bigint';
import ip6addr from 'ip6addr';
import { isString } from './strings.js';
import {
    toInteger, isNumberLike, toBigIntOrThrow,
    isNumber
} from './numbers.js';
import { getTypeOf } from './deps.js';
import { isBoolean } from './booleans.js';

export function isIP(input: unknown): input is string {
    return isString(input) && _isIP(input);
}

/** Will throw if input is not a valid CIDR */
export function isIPRangeOrThrow(input: unknown): string {
    if (!isCIDR(input)) {
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be a valid IP range`);
    }

    return input;
}

/** Will throw if input is not a valid IP */
export function isIPOrThrow(input: unknown): string {
    if (!isString(input) || !isIP(input)) {
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be a valid IP`);
    }

    return input;
}

export function isIPv6(input: unknown): boolean {
    return isString(input) && _isIPv6(input);
}

export function isIPv4(input: unknown): boolean {
    return isString(input) && _isIPv4(input);
}

export function isMappedIPv4(input: unknown): boolean {
    if (isIPv6(input)) {
        const parsed = ipaddr.parse(input as string) as IPv6;

        return parsed.isIPv4MappedAddress();
    }

    return false;
}

export function extractMappedIPv4(input: unknown): string {
    if (isIPv6(input) && isMappedIPv4(input)) {
        const parsed = ipaddr.parse(input as string) as IPv6;

        const ipv4 = parsed.toIPv4Address();

        return ipv4.octets.join('.');
    }

    throw Error('input must be an IPv4 address mapped to an IPv6 address');
}

export function inIPRange(
    input: unknown,
    args: { min?: string; max?: string; cidr?: string }
): boolean {
    if (!isIP(input)) return false;

    if (args.cidr != null) {
        return isCIDR(args.cidr) && ip6addr.createCIDR(args.cidr).contains(input as string);
    }

    const ipType = _ipVersion(input as string);

    const min = args.min || _assignMin(ipType as number);
    const max = args.max || _assignMax(ipType as number);

    return _validMinAndMax(min, max)
        && ip6addr.createAddrRange(min, max).contains(input as string);
}

function _assignMin(ipType: number, min?: string): string {
    if (min) return min;

    if (ipType === 4) return '0.0.0.0';

    return '::';
}

function _assignMax(ipType: number, max?: string): string {
    if (max) return max;

    if (ipType === 4) return '255.255.255.255';

    return 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff';
}

function _validMinAndMax(min: string, max: string): boolean {
    return isIP(min) && isIP(max)
        && _ipVersion(min) === _ipVersion(max)
        && ip6addr.compare(min, max) === -1;
}

export function isRoutableIP(input: unknown): boolean {
    if (!isIP(input)) return false;

    return !_isPrivateIP(input as string);
}

export function isNonRoutableIP(input: unknown): boolean {
    if (!isIP(input)) return false;

    return _isPrivateIP(input as string);
}

function _isPrivateIP(input: string): boolean {
    const parsedIp = _parseIpAddress(input);

    return _inPrivateIPRange(parsedIp.range()) || _inRestrictedIPRange(parsedIp);
}

function _parseIpAddress(input: string): ipaddr.IPv4 | ipaddr.IPv6 {
    if (isMappedIPv4(input)) {
        return ipaddr.parse(extractMappedIPv4(input));
    }

    return ipaddr.parse(input);
}

function _inPrivateIPRange(ipRange: string): boolean {
    return [
        'private',
        'uniqueLocal',
        'loopback',
        'unspecified',
        'carrierGradeNat',
        'linkLocal',
        'reserved',
        'rfc6052',
        'teredo',
        '6to4',
        'broadcast'
    ].includes(ipRange);
}

// parse the ranges here
// to avoid having to parse every time the function is called
const ipv4RestrictedRanges = [
    ipaddr.parseCIDR('192.31.196.0/24'),
    ipaddr.parseCIDR('192.52.193.0/24'),
    ipaddr.parseCIDR('192.175.48.0/24'),
    ipaddr.parseCIDR('198.18.0.0/15'),
    ipaddr.parseCIDR('224.0.0.0/8')
];

const ipv6RestrictedRanges = [
    ipaddr.parseCIDR('64:ff9b:1::/48'),
    ipaddr.parseCIDR('100::/64'),
    ipaddr.parseCIDR('2001::/23'),
    ipaddr.parseCIDR('2620:4f:8000::/48')
];

function _inRestrictedIPRange(parsedIp: ipaddr.IPv4 | ipaddr.IPv6): boolean {
    const rangesToCheck = parsedIp.kind() === 'ipv4' ? ipv4RestrictedRanges : ipv6RestrictedRanges;

    return rangesToCheck.some((ipRange) => parsedIp.match(ipRange));
}

export function isCIDR(input: unknown): input is string {
    return isString(input) && IPCIDR.isValidCIDR(input);
}

/**
 *
 * @param input ip address block in CIDR notation
 * @returns first IP address in the block
 * @deprecated use getFirstUsableIPInCIDR
 */
export function getCIDRMin(input: unknown): string {
    return getFirstUsableIPInCIDR(input);
}

/**
 *
 * @param input ip address block in CIDR notation
 * @returns last ip address in the block
 * @deprecated use getLastUsableIPInCIDR
 */
export function getCIDRMax(input: unknown): string {
    return getLastUsableIPInCIDR(input);
}

/**
 *
 * @param input ip address block in CIDR notation, inclusive
 * @returns first IP address in the block
 */
export function getFirstIPInCIDR(input: unknown): string {
    if (isCIDR(input)) {
        return shortenIPv6Address(new IPCIDR(input as string).start());
    }

    throw Error('input must be a valid IP address in CIDR notation');
}

/**
 *
 * @param input ip address block in CIDR notation
 * @returns last ip address in the block, inclusive
 */
export function getLastIPInCIDR(input: unknown): string {
    if (isCIDR(input)) {
        return shortenIPv6Address(new IPCIDR(input as string).end());
    }

    throw Error('input must be a valid IP address in CIDR notation');
}

/**
 *
 * @param input ip address block in CIDR notation
 * @returns first usable ip address of the CIDR block
 */
export function getFirstUsableIPInCIDR(input: unknown) {
    if (isCIDR(input)) {
        return createCIDR(input).first()
            .toString();
    }

    throw Error('input must be a valid IP address in CIDR notation');
}

/**
 *
 * @param input ip address block in CIDR notation
 * @returns last usable ip address of the CIDR block
 */
export function getLastUsableIPInCIDR(input: unknown) {
    if (isCIDR(input)) {
        return createCIDR(input).last()
            .toString();
    }

    throw Error('input must be a valid IP address in CIDR notation');
}

/**
 *
 * @param input ip address
 * @returns IPv6 addresses are returned without leading 0's in a group or empty groups
 *  ipv4 addresses are simply returned
 */
export function shortenIPv6Address(input: unknown) {
    if (isIP(input)) {
        return ip6addr.parse(input).toString();
    }

    throw Error('input must be a valid address');
}

export function getCIDRBroadcast(input: unknown): string {
    if (isCIDR(input)) {
        const asCIDR = createCIDR(input as string);

        if (isIPv4(asCIDR.address().toString())) {
            return asCIDR.broadcast().toString();
        }
    }

    throw Error('input must be a valid IPv4 address in CIDR notation');
}

export function getCIDRNetwork(input: unknown): string {
    if (isCIDR(input)) {
        const asCIDR = createCIDR(input as string);

        const address = asCIDR.address().toString();

        if (isIPv4(address)) {
            return ipaddr.IPv4.networkAddressFromCIDR(input as string).octets.join('.');
        }
    }

    throw Error('input must be a valid IPv4 address in CIDR notation');
}

export function toCIDR(input: unknown, suffix: string | number): string {
    if (isIP(input) && _validSuffix(_ipVersion(input as string), suffix)) {
        return createCIDR(input as string, toInteger(suffix) as number).toString();
    }

    throw Error('input must be a valid IP address and suffix must be a value <= 32 for IPv4 or <= 128 for IPv6');
}

function _validSuffix(ipVersion: number | undefined, suffix: number | string): boolean {
    if (isNumberLike(suffix)) {
        const asInt = toInteger(suffix);

        if (isBoolean(asInt)) return false;
        if (asInt < 0) return false;
        if (ipVersion === 4) return asInt <= 32;
        if (ipVersion === 6) return asInt <= 128;
    }

    return false;
}

function createCIDR(input: string, suffix?: number): ip6addr.CIDR {
    if (suffix != null) {
        return ip6addr.createCIDR(input, suffix);
    }

    return ip6addr.createCIDR(input);
}

export function isNonZeroCidr(input: string): boolean {
    const cidrValue = isCidr(input);
    if (isNumber(cidrValue) && cidrValue > 0) return true;
    return false;
}

export function ipToInt(input: unknown): bigint {
    if (isIP(input)) {
        return toBigIntOrThrow(parseIp(input as string).number);
    }

    throw Error('input must be a valid ip address');
}

export function intToIP(input: unknown, ipVersion: string | number): string {
    const versionAsInt = toInteger(ipVersion);

    if (isNumberLike(input) && (versionAsInt === 4 || versionAsInt === 6)) {
        const bigInt = BigInt(input as string | number | bigint);
        const maxIpV4 = 2n ** 32n - 1n;
        const maxIpV6 = 2n ** 128n - 1n;
        if (bigInt < 0n || bigInt > (versionAsInt === 4 ? maxIpV4 : maxIpV6)) {
            throw new Error(`Invalid IP input: ${bigInt}`);
        }
        return stringifyIp({
            number: bigInt,
            version: versionAsInt,
            ipv4mapped: false,
            scopeid: undefined
        });
    }

    throw Error('input should be a big int or string for large numbers. Version must be 4 or 6');
}

export function reverseIP(input: unknown): string {
    if (!isIP(input)) throw Error('input must be a valid ip address');

    const parsedIp = ipaddr.parse(input as string);

    if (parsedIp.kind() === 'ipv4') {
        return (parsedIp as IPv4).octets.reverse().join('.');
    }

    return _reverseIPv6(parsedIp as IPv6);
}

function _reverseIPv6(ip: ipaddr.IPv6): string {
    return ip.toNormalizedString().split(':')
        .reduce((parts: string[], part: string) => {
            parts.push(_expandIPv6Part(part));

            return parts;
        }, [])
        .join('')
        .split('')
        .reverse()
        .join('.');
}

function _expandIPv6Part(part: string) {
    let expandedPart = part;

    while (expandedPart.length < 4) {
        expandedPart = `0${expandedPart}`;
    }

    return expandedPart;
}
