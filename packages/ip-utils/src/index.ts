import {
    toInteger, isNumberLike, toBigIntOrThrow,
    isString, getTypeOf, isBoolean,
} from '@terascope/core-utils';
import { IPAddress } from './utils/ip-address.js';
import { CIDRBlock } from './utils/cidr-block.js';
import { IPRange } from './utils/ip-range.js';

export { IPAddress, CIDRBlock, IPRange };

export function isIP(input: unknown): input is string {
    return isString(input) && IPAddress.isValid(input);
}

/** Will throw if input is not a valid CIDR */
export function isIPRangeOrThrow(input: unknown): string {
    if (!isCIDR(input)) {
        throw new TypeError(
            `Expected ${input} (${getTypeOf(input)}) to be a valid IP range`,
        );
    }

    return input;
}

/** Will throw if input is not a valid IP */
export function isIPOrThrow(input: unknown): string {
    if (!isString(input) || !isIP(input)) {
        throw new TypeError(
            `Expected ${input} (${getTypeOf(input)}) to be a valid IP`,
        );
    }

    return input;
}

export function isIPv6(input: unknown): boolean {
    return isString(input) && IPAddress.isIPv6(input);
}

export function isIPv4(input: unknown): boolean {
    return isString(input) && IPAddress.isIPv4(input);
}

export function isMappedIPv4(input: unknown): boolean {
    if (!isIPv6(input)) return false;
    return IPAddress.of(input as string).isMappedIPv4();
}

export function extractMappedIPv4(input: unknown): string {
    if (isIPv6(input) && isMappedIPv4(input)) {
        return IPAddress.of(input as string)
            .toMappedIPv4()
            .toString();
    }

    throw Error('input must be an IPv4 address mapped to an IPv6 address');
}

export function inIPRange(
    input: unknown,
    args: { min?: string; max?: string; cidr?: string },
): boolean {
    if (!isIP(input)) return false;

    const ip = IPAddress.of(input as string);

    if (args.cidr != null) {
        if (!isCIDR(args.cidr)) return false;
        return CIDRBlock.of(args.cidr).contains(ip);
    }

    const ipVersion = ip.version;
    const minStr = args.min ?? _assignMin(ipVersion);
    const maxStr = args.max ?? _assignMax(ipVersion);

    if (!_validMinAndMax(minStr, maxStr)) return false;

    const min = IPAddress.of(minStr);
    const max = IPAddress.of(maxStr);

    return ip.compare(min) >= 0 && ip.compare(max) <= 0;
}

function _assignMin(version: 4 | 6): string {
    return version === 4 ? '0.0.0.0' : '::';
}

function _assignMax(version: 4 | 6): string {
    return version === 4
        ? '255.255.255.255'
        : 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff';
}

function _validMinAndMax(min: string, max: string): boolean {
    if (!IPAddress.isValid(min) || !IPAddress.isValid(max)) return false;

    const minIP = IPAddress.of(min);
    const maxIP = IPAddress.of(max);

    if (minIP.version !== maxIP.version) return false;
    return minIP.compare(maxIP) <= 0;
}

export function isRoutableIP(input: unknown): boolean {
    if (!isIP(input)) return false;
    return IPAddress.of(input as string).isRoutable();
}

export function isNonRoutableIP(input: unknown): boolean {
    if (!isIP(input)) return false;
    return !IPAddress.of(input as string).isRoutable();
}

export function isCIDR(input: unknown): input is string {
    return isString(input) && CIDRBlock.isValid(input);
}

/**
 * @param input ip address block in CIDR notation
 * @returns first IP address in the block
 * @deprecated use getFirstUsableIPInCIDR
 */
export function getCIDRMin(input: unknown): string {
    return getFirstUsableIPInCIDR(input);
}

/**
 * @param input ip address block in CIDR notation
 * @returns last ip address in the block
 * @deprecated use getLastUsableIPInCIDR
 */
export function getCIDRMax(input: unknown): string {
    return getLastUsableIPInCIDR(input);
}

/**
 * @param input ip address block in CIDR notation, inclusive
 * @returns first IP address in the block
 */
export function getFirstIPInCIDR(input: unknown): string {
    if (isCIDR(input)) {
        return CIDRBlock.of(input as string)
            .first()
            .toString();
    }

    throw Error('input must be a valid IP address in CIDR notation');
}

/**
 * @param input ip address block in CIDR notation
 * @returns last ip address in the block, inclusive
 */
export function getLastIPInCIDR(input: unknown): string {
    if (isCIDR(input)) {
        return CIDRBlock.of(input as string)
            .last()
            .toString();
    }

    throw Error('input must be a valid IP address in CIDR notation');
}

/**
 * @param input ip address block in CIDR notation
 * @returns first usable ip address of the CIDR block
 */
export function getFirstUsableIPInCIDR(input: unknown): string {
    if (isCIDR(input)) {
        return CIDRBlock.of(input as string)
            .firstUsable()
            .toString();
    }

    throw Error('input must be a valid IP address in CIDR notation');
}

/**
 * @param input ip address block in CIDR notation
 * @returns last usable ip address of the CIDR block
 */
export function getLastUsableIPInCIDR(input: unknown): string {
    if (isCIDR(input)) {
        return CIDRBlock.of(input as string)
            .lastUsable()
            .toString();
    }

    throw Error('input must be a valid IP address in CIDR notation');
}

/**
 * @param input ip address
 * @returns IPv6 addresses are returned without leading 0's in a group or empty groups;
 *  ipv4 addresses are simply returned
 */
export function shortenIPv6Address(input: unknown): string {
    if (isIP(input)) {
        return IPAddress.of(input as string).toString();
    }

    throw Error('input must be a valid address');
}

export function getCIDRBroadcast(input: unknown): string {
    if (isCIDR(input)) {
        const block = CIDRBlock.of(input as string);
        if (block.version === 4) {
            return block.broadcast().toString();
        }
    }

    throw Error('input must be a valid IPv4 address in CIDR notation');
}

export function getCIDRNetwork(input: unknown): string {
    if (isCIDR(input)) {
        const block = CIDRBlock.of(input as string);
        if (block.version === 4) {
            return block.network().toString();
        }
    }

    throw Error('input must be a valid IPv4 address in CIDR notation');
}

export function toCIDR(input: unknown, suffix: string | number): string {
    if (
        isIP(input)
        && _validSuffix(IPAddress.ipVersion(input as string), suffix)
    ) {
        const ip = IPAddress.of(input as string);
        return CIDRBlock.from(ip, toInteger(suffix) as number).toString();
    }

    throw Error(
        'input must be a valid IP address and suffix must be a value <= 32 for IPv4 or <= 128 for IPv6',
    );
}

function _validSuffix(
    ipVersion: number | undefined,
    suffix: number | string,
): boolean {
    if (isNumberLike(suffix)) {
        const asInt = toInteger(suffix);

        if (isBoolean(asInt)) return false;
        if (asInt < 0) return false;
        if (ipVersion === 4) return asInt <= 32;
        if (ipVersion === 6) return asInt <= 128;
    }

    return false;
}

export function isNonZeroCidr(input: string): boolean {
    return CIDRBlock.isCidr(input) > 0;
}

export function ipToInt(input: unknown): bigint {
    if (isIP(input)) {
        return toBigIntOrThrow(IPAddress.of(input as string).toInt());
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
        return IPAddress.fromInt(bigInt, versionAsInt as 4 | 6).toString();
    }

    throw Error(
        'input should be a big int or string for large numbers. Version must be 4 or 6',
    );
}

export function reverseIP(input: unknown): string {
    if (!isIP(input)) throw Error('input must be a valid ip address');

    return IPAddress.of(input as string).reverse();
}

/**
 * Returns the smallest CIDR block that encloses both IP addresses.
 * Both IPs must be the same version (both IPv4 or both IPv6).
 */
export function ipsToCIDR(ip1: unknown, ip2: unknown): string {
    const a = IPAddress.of(isIPOrThrow(ip1));
    const b = IPAddress.of(isIPOrThrow(ip2));

    return CIDRBlock.enclosing(a, b).toString();
}
