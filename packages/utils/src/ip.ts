import _isIP from 'is-ip';
import ipaddr from 'ipaddr.js';
import ip6addr from 'ip6addr';
import validateCidr from 'is-cidr';
import { isString } from './strings';

export function isIP(input: unknown): boolean {
    return isString(input) && _isIP(input) != null;
}

export function isIPV6(input: unknown): boolean {
    return isString(input) && _isIP.v6(input) != null;
}

export function isIPV4(input: unknown): boolean {
    return isString(input) && _isIP.v4(input) != null;
}

export function isCIDR(input: unknown): boolean {
    return isString(input) && validateCidr(input) > 0;
}

export function inIPRange(
    input: string,
    args: { min?: string; max?: string; cidr?: string }
): boolean {
    const MIN_IPV4_IP = '0.0.0.0';
    const MAX_IPV4_IP = '255.255.255.255';
    const MIN_IPV6_IP = '::';
    const MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';

    if (!isIP(input)) return false;

    // assign min/max IP range values
    if (args.cidr) {
        if (!isCIDR(args.cidr)) return false;
        return ip6addr.createCIDR(args.cidr).contains(input);
    }

    // assign upper/lower bound even if min or max is missing
    let { min, max } = args;
    if (!min) min = _isIP.v6(input) ? MIN_IPV6_IP : MIN_IPV4_IP;
    if (!max) max = _isIP.v6(input) ? MAX_IPV6_IP : MAX_IPV4_IP;

    // min and max must be valid ips, same IP type, and min < max
    if (!isIP(min) || !isIP(max) || _isIP.v6(min) !== _isIP.v6(max)
        || ip6addr.compare(max, min) === -1) {
        return false;
    }

    return ip6addr.createAddrRange(min, max).contains(input);
}

export function isRoutableIP(input: unknown):boolean {
    if (!isIP(input)) return false;

    return !_privateIP(input as string);
}

export function isNONRoutableIP(input: unknown):boolean {
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

function _inRestrictedIPRange(parsedIp: ipaddr.IPv4 | ipaddr.IPv6): boolean {
    const ipv4RestrictedRanges = [
        '192.31.196.0/24',
        '192.52.193.0/24',
        '192.175.48.0/24',
        '198.18.0.0/15',
        '224.0.0.0/8'
    ];

    const ipv6RestrictedRanges = [
        '64:ff9b:1::/48',
        '100::/64',
        '2001::/23',
        '2620:4f:8000::/48'
    ];

    const rangesToCheck = parsedIp.kind() === 'ipv4' ? ipv4RestrictedRanges : ipv6RestrictedRanges;

    return rangesToCheck.some((ipRange) => parsedIp.match(ipaddr.parseCIDR(ipRange)));
}
