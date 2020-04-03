import * as ts from '@terascope/utils';
import ipaddr from 'ipaddr.js';
import { isIP as checkIP, isIPv6 } from 'net';
// @ts-ignore
import ip6addr from 'ip6addr';
import isCidr from 'is-cidr';
import PhoneValidator from 'awesome-phonenumber';
import validator from 'validator';
import * as url from 'valid-url';
import { JoinGeoShape, MACAddress } from '@terascope/types';

import {
    FQDNOptions,
    HashConfig,
    LengthConfig,
    PostalCodeLocale,
    ArgsISSNOptions,
} from './interfaces';

import * as i from '../interfaces';

export const repository: i.Repository = {
    isBoolean: { fn: isBoolean, config: {} },
    isBooleanLike: { fn: isBooleanLike, config: {} },
    isEmail: { fn: isEmail, config: {} },
    isGeoJSON: { fn: isGeoJSON, config: {} },
    isGeoPoint: { fn: isGeoPoint, config: {} },
    isGeoShapePoint: { fn: isGeoShapePoint, config: {} },
    isGeoShapePolygon: { fn: isGeoShapePolygon, config: {} },
    isGeoShapeMultiPolygon: { fn: isGeoShapeMultiPolygon, config: {} },
    isIP: { fn: isIP, config: {} },
    isISDN: { fn: isISDN, config: {} },
    isMacAddress: {
        fn: isMacAddress,
        config: {
            delimiter: { type: 'String', array: true }
        },

    },
    isNumber: { fn: isNumber, config: {} },
    isInteger: { fn: isInteger, config: {} },
    inNumberRange: {
        fn: inNumberRange,
        config: {
            min: { type: 'Number' },
            max: { type: 'Number' },
            inclusive: { type: 'Boolean' }
        },

    },
    isString: { fn: isString, config: {} },
    isUrl: { fn: isUrl, config: {} },
    isUUID: { fn: isUUID, config: {} },
    contains: {
        fn: contains,
        config: {
            value: { type: 'String' }
        },

    },
    equals: {
        fn: equals,
        config: { value: { type: 'String' } },

    },
    isAlpha: {
        fn: isAlpha,
        config: {
            locale: { type: 'String' }
        },

    },
    isAlphanumeric: {
        fn: isAlphanumeric,
        config: {
            locale: { type: 'String' }
        },

    },
    isAscii: { fn: isAscii, config: {} },
    isBase64: { fn: isBase64, config: {} },
    isEmpty: {
        fn: isEmpty,
        config: {
            ignoreWhitespace: { type: 'Boolean' }
        },

    },
    isFQDN: {
        fn: isFQDN,
        config: {
            requireTld: { type: 'Boolean' },
            allowUnderscores: { type: 'Boolean' },
            allowTrailingDot: { type: 'Boolean' },
        },

    },
    isHash: {
        fn: isHash,
        config: {
            algo: { type: 'String' }
        },

    },
    isCountryCode: { fn: isCountryCode, config: {} },
    isISO8601: { fn: isISO8601, config: {} },
    isISSN: {
        fn: isISSN,
        config: {
            caseSensitive: { type: 'Boolean' },
            requireHyphen: { type: 'Boolean' }
        },

    },
    isRFC3339: { fn: isRFC3339, config: {} },
    isJSON: { fn: isJSON, config: {} },
    isLength: {
        fn: isLength,
        config: {
            size: { type: 'Number' },
            min: { type: 'Number' },
            max: { type: 'Number' },
        },

    },
    isMimeType: { fn: isMimeType, config: {} },
    isPostalCode: {
        fn: isPostalCode,
        config: {
            locale: { type: 'String' }
        },

    },
    isRoutableIp: { fn: isRoutableIP, config: {} },
    isNonRoutableIp: { fn: isNonRoutableIP, config: {} },
    inIPRange: {
        fn: inIPRange,
        config: {
            min: { type: 'String' },
            max: { type: 'String' },
            cidr: { type: 'String' }
        },

    },
    isIPCidr: { fn: isIPCidr, config: {} },
    exists: { fn: exists, config: {} },
    guard: { fn: guard, config: {} },
    isArray: { fn: isArray, config: {} },
    some: {
        fn: some,
        config: {
            fn: { type: 'String' },
            options: { type: 'Object' }
        }
    },
    every: {
        fn: every,
        config: {
            fn: { type: 'String' },
            options: { type: 'Object' }
        }
    },
};

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isBoolean(input: any): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return input.filter(ts.isNotNil).every(ts.isBoolean);

    return ts.isBoolean(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isBooleanLike(input: any): boolean {
    if (isArray(input)) return input.filter(ts.isNotNil).every(ts.isBooleanLike);

    return ts.isBooleanLike(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isEmail(input: any): boolean {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return input.filter(ts.isNotNil).every(ts.isEmail);

    return ts.isEmail(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns
 */
export function isGeoPoint(input: any) {
    if (ts.isNil(input)) return false;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .every((data) => ts.parseGeoPoint(data, false));
    }

    // TODO: check for tuple vs an array of numbers
    const results = ts.parseGeoPoint(input, false);
    return results != null;
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns
 */
export function isGeoJSON(input: any) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return input.filter(ts.isNotNil).every(ts.isGeoJSON);

    return ts.isGeoJSON(input);
}

/**
 *
 *
 * @export
 * @param {JoinGeoShape} input
 * @returns
 */
export function isGeoShapePoint(input: JoinGeoShape) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return input.filter(ts.isNotNil).every(ts.isGeoShapePoint);

    return ts.isGeoShapePoint(input);
}

/**
 *
 *
 * @export
 * @param {JoinGeoShape} input
 * @returns
 */
export function isGeoShapePolygon(input: JoinGeoShape) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return input.filter(ts.isNotNil).every(ts.isGeoShapePolygon);

    return ts.isGeoShapePolygon(input);
}

/**
 *
 *
 * @export
 * @param {JoinGeoShape} input
 * @returns
 */
export function isGeoShapeMultiPolygon(input: JoinGeoShape) {
    if (ts.isNil(input)) return false;
    if (isArray(input)) return input.filter(ts.isNotNil).every(ts.isGeoShapeMultiPolygon);

    return ts.isGeoShapeMultiPolygon(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns
 */
export function isIP(input: any) {
    if (ts.isNil(input)) return false;

    if (checkIP(input) === 0) return false;

    // needed to check for inputs like - '::192.168.1.18'
    if (input.includes(':') && input.includes('.')) return false;

    return true;
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isRoutableIP(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (!isIP(input)) return false;

    const range = ipaddr.parse(input).range();
    return range !== 'private' && range !== 'uniqueLocal';
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isNonRoutableIP(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (!isIP(input)) return false;

    const range = ipaddr.parse(input).range();
    return range === 'private' || range === 'uniqueLocal';
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns
 */
export function isIPCidr(input: any) {
    if (ts.isNil(input)) return false;

    if (isCidr(input) > 0) return true;

    return false;
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {{ min?: string; max?: string; cidr?: string }} args
 * @returns
 */
export function inIPRange(input: any, args: { min?: string; max?: string; cidr?: string }) {
    if (ts.isNil(input)) return false;

    const MIN_IPV4_IP = '0.0.0.0';
    const MAX_IPV4_IP = '255.255.255.255';
    const MIN_IPV6_IP = '::';
    const MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';

    if (!isIP(input)) return false;

    // assign min/max ip range values
    if (args.cidr) {
        if (!isIPCidr(args.cidr)) return false;
        return ip6addr.createCIDR(args.cidr).contains(input);
    }

    // assign upper/lower bound even if min or max is missing
    let { min, max } = args;
    if (!min) min = isIPv6(input) ? MIN_IPV6_IP : MIN_IPV4_IP;
    if (!max) max = isIPv6(input) ? MAX_IPV6_IP : MAX_IPV4_IP;

    // min and max must be valid ips, same ip type, and min < max
    if (!isIP(min) || !isIP(max) || isIPv6(min) !== isIPv6(max)
        || ip6addr.compare(max, min) === -1) {
        return false;
    }

    return ip6addr.createAddrRange(min, max).contains(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isISDN(input: any): boolean {
    if (ts.isNil(input)) return false;

    const phoneNumber = new PhoneValidator(`+${input}`);
    return phoneNumber.isValid();
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {MACAddress} [args]
 * @returns {boolean}
 */
export function isMacAddress(input: any, args?: MACAddress): boolean {
    if (ts.isNil(input)) return false;

    return ts.isMacAddress(input, args);
}

/**
 *
 *
 * @export
 * @param {number} input
 * @param {{ min?: number; max?: number; inclusive?: boolean }} args
 * @returns {boolean}
 */
export function inNumberRange(input: number,
    args: { min?: number; max?: number; inclusive?: boolean }): boolean {
    if (ts.isNil(input)) return false;

    return ts.inNumberRange(input, args);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {input is number}
 */
export function isNumber(input: any): input is number {
    if (ts.isNil(input)) return false;

    return ts.isNumber(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isInteger(input: any): boolean {
    if (ts.isNil(input)) return false;

    return ts.isInteger(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isString(input: any): boolean {
    if (ts.isNil(input)) return false;

    return ts.isString(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isUrl(input: any): boolean {
    if (ts.isNil(input)) return false;

    if (!isString(input) || url.isUri(input) == null) return false;

    return true;
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isUUID(input: any): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && validator.isUUID(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {{ value: string }} { value }
 * @returns {boolean}
 */
export function contains(input: any, { value }: { value: string }): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && input.includes(value);
}
// TODO: should this do more
/**
 *
 *
 * @export
 * @param {*} input
 * @param {{ value: string }} { value }
 * @returns {boolean}
 */
export function equals(input: any, { value }: { value: string }): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && input === value;
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {{ locale: validator.AlphaLocale }} [args]
 * @returns {boolean}
 */
export function isAlpha(input: any, args?: { locale: validator.AlphaLocale }): boolean {
    if (ts.isNil(input)) return false;

    const locale: validator.AlphaLocale = args && args.locale ? args.locale : 'en-US';
    return isString(input) && validator.isAlpha(input, locale);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {{ locale: validator.AlphanumericLocale }} [args]
 * @returns {boolean}
 */
export function isAlphanumeric(input: any,
    args?: { locale: validator.AlphanumericLocale }): boolean {
    if (ts.isNil(input)) return false;

    const locale: validator.AlphanumericLocale = args && args.locale ? args.locale : 'en-US';
    return isString(input) && validator.isAlphanumeric(input, locale);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isAscii(input: any): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && validator.isAscii(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isBase64(input: any): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && validator.isBase64(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {{ ignoreWhitespace: boolean }} [args]
 * @returns {boolean}
 */
export function isEmpty(input: any, args?: { ignoreWhitespace: boolean }): boolean {
    let value = input;

    if (isString(value) && args && args.ignoreWhitespace) {
        value = value.trim();
    }

    return ts.isEmpty(value);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {FQDNOptions} [args]
 * @returns {boolean}
 */
export function isFQDN(input: any, args?: FQDNOptions): boolean {
    if (ts.isNil(input)) return false;

    const config = {
        require_tld: args?.requireTld || true,
        allow_underscores: args?.allowUnderscores || false,
        allow_trailing_dot: args?.allowTrailingDot || false
    };

    return isString(input) && validator.isFQDN(input, config);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {HashConfig} { algo }
 * @returns {boolean}
 */
export function isHash(input: any, { algo }: HashConfig): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && validator.isHash(input, algo);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isCountryCode(input: any): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && validator.isISO31661Alpha2(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isISO8601(input: any): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && validator.isISO8601(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {ArgsISSNOptions} [args]
 * @returns {boolean}
 */
export function isISSN(input: any, args?: ArgsISSNOptions): boolean {
    if (ts.isNil(input)) return false;

    const config = {
        case_sensitive: args?.caseSensitive || false,
        require_hyphen: args?.requireHyphen || false
    };

    return isString(input) && validator.isISSN(input, config);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isRFC3339(input: any): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && validator.isRFC3339(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isJSON(input: any): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && validator.isJSON(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {LengthConfig} { size, min, max }
 * @returns
 */
export function isLength(input: any, { size, min, max }: LengthConfig) {
    if (ts.isNil(input)) return false;

    if (isString(input)) {
        if (size) return input.length === size;
        if (min || max) return validator.isLength(input, { min, max });
    }
    return false;
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isMimeType(input: any): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && validator.isMimeType(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {({ locale: 'any' | PostalCodeLocale })} { locale }
 * @returns {boolean}
 */
export function isPostalCode(input: any, { locale }: { locale: 'any' | PostalCodeLocale }): boolean {
    if (ts.isNil(input)) return false;

    return isString(input) && validator.isPostalCode(input, locale);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function isValidDate(input: any): boolean {
    if (ts.isNil(input)) return false;

    return !isBoolean(input) && ts.isValidDate(input);
}

// NOTE: this function will throw compared to all other validations
/**
 *
 *
 * @export
 * @param {*} input
 * @returns
 */
export function guard(input: any) {
    if (ts.isNil(input)) throw new Error('Expected value not to be empty');
    return true;
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {boolean}
 */
export function exists(input: any): boolean {
    return !ts.isNil(input);
}

/**
 *
 *
 * @export
 * @param {*} input
 * @returns {input is any[]}
 */
export function isArray(input: any): input is any[] {
    if (Array.isArray(input)) return true;
    return false;
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {{ fn: string; options?: any }} { fn, options }
 * @returns {boolean}
 */
export function some(input: any, { fn, options }: { fn: string; options?: any }): boolean {
    if (!isArray(input)) return false;

    const repoConfig = repository[fn];
    if (!repoConfig) throw new Error(`No function ${fn} was found in the field validator respository`);

    return input.some((data: any) => repoConfig.fn(data, options));
}

/**
 *
 *
 * @export
 * @param {*} input
 * @param {{ fn: string; options?: any }} { fn, options }
 * @returns {boolean}
 */
export function every(input: any, { fn, options }: { fn: string; options?: any }): boolean {
    if (!isArray(input)) return false;

    const repoConfig = repository[fn];
    if (!repoConfig) throw new Error(`No function ${fn} was found in the field validator respository`);

    return input.every((data: any) => repoConfig.fn(data, options));
}
