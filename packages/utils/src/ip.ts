import _isIP from 'is-ip';
import ipaddr, { IPv4, IPv6 } from 'ipaddr.js';
import ip6addr from 'ip6addr';
import validateCidr from 'is-cidr';
import { isString } from './strings';

export function isIP(input: unknown): boolean {
    return isString(input) && _isIP(input);
}

export function isIPV6(input: unknown): boolean {
    return isString(input) && _isIP.v6(input);
}

export function isIPV4(input: unknown): boolean {
    return isString(input) && _isIP.v4(input);
}

export function isCIDR(input: unknown): boolean {
    return isString(input) && validateCidr(input) > 0;
}

export function reverseIP(input: string): string {
    if (!isIP(input)) throw Error('input must be a valid ip address');

    const parsedIp = ipaddr.parse(input);

    if (parsedIp.kind() === 'ipv4') {
        return _reverseIPv4(parsedIp as IPv4);
    }

    return _reverseIPv6(parsedIp as IPv6);
}

function _reverseIPv4(ip: ipaddr.IPv4): string {
    return ip.octets.reverse().join('.');
}

function _reverseIPv6(ip: ipaddr.IPv6): string {
    const ipParts = ip.toNormalizedString().split(':');

    const nIP: string[] = [];

    for (const p of ipParts) {
        const expanded = expandIpv6(p);
        nIP.push(expanded);
    }

    return nIP.join('').split('').reverse().join('.');
}

function expandIpv6(part: string) {
    let c = part;

    while (c.length < 4) {
        c = `0${c}`;
    }

    return c;
}

export function inIPRange(
    input: string,
    args: { min?: string; max?: string; cidr?: string }
): boolean {
    if (!isIP(input)) return false;

    if (args.cidr) {
        return isCIDR(args.cidr) && ip6addr.createCIDR(args.cidr).contains(input);
    }

    const ipType = _isIP.version(input);

    const min = args.min || _assignMin(ipType as number);
    const max = args.max || _assignMax(ipType as number);

    return _validMinAndMax(min, max)
        && ip6addr.createAddrRange(min, max).contains(input);
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

    return !_privateIP(input as string);
}

export function isNonRoutableIP(input: unknown):boolean {
    if (!isIP(input)) return false;

    return _privateIP(input as string);
}

function _privateIP(input: string): boolean {
    const parsedIp = _parseIpAddress(input);

    const ipRangeName = parsedIp.range();

    return _inPrivateIPRange(ipRangeName) || _inRestrictedIPRange(parsedIp);
}

function _parseIpAddress(input: string): ipaddr.IPv4 | ipaddr.IPv6 {
    const ipv4Regex = /\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}\b/;

    const parsed = ipaddr.parse(input);

    // if ipv6 mapped v4 then need to return the parsed ipv4 address
    if (parsed.kind() === 'ipv6') {
        const ipv4 = input.match(ipv4Regex);

        if (ipv4 != null && Array.isArray(ipv4)) {
            return ipaddr.parse(ipv4[0]);
        }
    }

    return parsed;
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
