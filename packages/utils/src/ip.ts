import _isIP from 'is-ip';
import ipaddr, { IPv4, IPv6 } from 'ipaddr.js';
import { parse, stringify } from 'ip-bigint';
import ip6addr from 'ip6addr';
import validateCidr from 'is-cidr';
import { isString } from './strings';
import { toInteger, isNumberLike, toBigIntOrThrow } from './numbers';
import { getTypeOf } from './deps';

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

export function isIPV6(input: unknown): boolean {
    return isString(input) && _isIP.v6(input);
}

export function isIPV4(input: unknown): boolean {
    return isString(input) && _isIP.v4(input);
}

export function isMappedIPV4(input: unknown): boolean {
    if (isIPV6(input)) {
        const parsed = ipaddr.parse(input as string) as IPv6;

        return parsed.isIPv4MappedAddress();
    }

    return false;
}

export function extractMappedIPV4(input: unknown): string {
    if (isIPV6(input) && isMappedIPV4(input)) {
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

    const ipType = _isIP.version(input as string);

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
        && _isIP.version(min) === _isIP.version(max)
        && ip6addr.compare(min, max) === -1;
}

export function isRoutableIP(input: unknown):boolean {
    if (!isIP(input)) return false;

    return !_isPrivateIP(input as string);
}

export function isNonRoutableIP(input: unknown):boolean {
    if (!isIP(input)) return false;

    return _isPrivateIP(input as string);
}

function _isPrivateIP(input: string): boolean {
    const parsedIp = _parseIpAddress(input);

    return _inPrivateIPRange(parsedIp.range()) || _inRestrictedIPRange(parsedIp);
}

function _parseIpAddress(input: string): ipaddr.IPv4 | ipaddr.IPv6 {
    if (isMappedIPV4(input)) {
        return ipaddr.parse(extractMappedIPV4(input));
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
    return isString(input) && validateCidr(input) > 0;
}

export function getCIDRMin(input: unknown): string {
    if (isCIDR(input)) {
        return createCIDR(input as string).first().toString();
    }

    throw Error('input must be a valid IP address in CIDR notation');
}

export function getCIDRMax(input: unknown): string {
    if (isCIDR(input)) {
        return createCIDR(input as string).last().toString();
    }

    throw Error('input must be a valid IP address in CIDR notation');
}

export function getCIDRBroadcast(input: unknown): string {
    if (isCIDR(input)) {
        const asCIDR = createCIDR(input as string);

        if (isIPV4(asCIDR.address().toString())) {
            return asCIDR.broadcast().toString();
        }
    }

    throw Error('input must be a valid IPv4 address in CIDR notation');
}

export function getCIDRNetwork(input: unknown): string {
    if (isCIDR(input)) {
        const asCIDR = createCIDR(input as string);

        const address = asCIDR.address().toString();

        if (isIPV4(address)) {
            return ipaddr.IPv4.networkAddressFromCIDR(input as string).octets.join('.');
        }
    }

    throw Error('input must be a valid IPv4 address in CIDR notation');
}

export function toCIDR(input: unknown, suffix: string | number): string {
    if (isIP(input) && _validSuffix(_isIP.version(input as string), suffix)) {
        return createCIDR(input as string, toInteger(suffix) as number).toString();
    }

    throw Error('input must be a valid IP address and suffix must be a value <= 32 for IPv4 or <= 128 for IPv6');
}

function _validSuffix(ipVersion: number | undefined, suffix: number | string): boolean {
    if (isNumberLike(suffix)) {
        const asInt = toInteger(suffix);

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

export function ipToInt(input: unknown): bigint {
    if (isIP(input)) {
        return toBigIntOrThrow(parse(input as string).number);
    }

    throw Error('input must be a valid ip address');
}

export function intToIP(input: unknown, ipVersion: string | number): string {
    const versionAsInt = toInteger(ipVersion);

    if (isNumberLike(input) && (versionAsInt === 4 || versionAsInt === 6)) {
        return stringify({
            number: BigInt(input),
            version: versionAsInt,
            ipv4mapped: false,
            scopeid: false
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
    return ip.toNormalizedString().split(':').reduce((parts: string[], part: string) => {
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
