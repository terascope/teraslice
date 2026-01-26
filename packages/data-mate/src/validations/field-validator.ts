import {
    isNil, isNotNil, isMACAddressFP, isArrayLike,
    inNumberRangeFP, isDeepEqual, includes,
    isBoolean as utilsIsBoolean,
    isBooleanLike as utilsIsBooleanLike,
    isEmail as utilsIsEmail,
    inNumberRange as utilsInNumberRange,
    isNumber as utilsIsNumber,
    isMACAddress as utilsIsMacAddress,
    isInteger as utilsIsInteger,
    isString as utilsIsString,
    isEmpty as utilsIsEmpty,
    isValidDate as utilsIsValidDate
} from '@terascope/core-utils';
import {
    parseGeoPoint,
    isGeoJSON as utilsIsGeoJSON,
    isGeoShapePoint as utilsIsGeoShapePoint,
    isGeoShapePolygon as utilsIsGeoShapePolygon,
    isGeoShapeMultiPolygon as utilsIsGeoShapeMultiPolygon,
} from '@terascope/geo-utils';
import {
    isIPv6, isNonZeroCidr,
    isIP as utilsIsIP

} from '@terascope/ip-utils';
// TODO: should this be comming from ip utils?
import ipaddr from 'ipaddr.js';
// TODO: should this be comming from ip utils?
import ip6addr from 'ip6addr';
// TODO: should this be comming from utils?
import { parsePhoneNumber } from 'awesome-phonenumber';
// TODO: should this be comming from utils?
import validator from 'validator';
import url from 'valid-url';
import { FieldType, GeoShapePoint, MACDelimiter } from '@terascope/types';
import {
    FQDNOptions, HashConfig, LengthConfig,
    PostalCodeLocale, ArgsISSNOptions,
} from './interfaces.js';

import * as i from '../interfaces.js';

export const repository: i.Repository = {
    isBoolean: { fn: isBoolean, config: {}, primary_input_type: i.InputType.Boolean },
    isBooleanLike: { fn: isBooleanLike, config: {}, primary_input_type: i.InputType.Any },
    isEmail: { fn: isEmail, config: {}, primary_input_type: i.InputType.String },
    isGeoJSON: { fn: isGeoJSON, config: {}, primary_input_type: i.InputType.Object },
    isGeoPoint: { fn: isGeoPoint, config: {}, primary_input_type: i.InputType.String },
    isGeoShapePoint: { fn: isGeoShapePoint, config: {}, primary_input_type: i.InputType.Object },
    isGeoShapePolygon: {
        fn: isGeoShapePolygon,
        config: {},
        primary_input_type: i.InputType.Object
    },
    isGeoShapeMultiPolygon: {
        fn: isGeoShapeMultiPolygon,
        config: {},
        primary_input_type: i.InputType.Object
    },
    isIP: { fn: isIP, config: {}, primary_input_type: i.InputType.String },
    isISDN: { fn: isISDN, config: {}, primary_input_type: i.InputType.String },
    isMACAddress: {
        fn: isMACAddress,
        config: {
            delimiter: { type: FieldType.String, array: true }
        },
        primary_input_type: i.InputType.String
    },
    isNumber: { fn: isNumber, config: {}, primary_input_type: i.InputType.Number },
    isInteger: { fn: isInteger, config: {}, primary_input_type: i.InputType.Number },
    inNumberRange: {
        fn: inNumberRange,
        config: {
            min: { type: FieldType.Number },
            max: { type: FieldType.Number },
            inclusive: { type: FieldType.Boolean }
        },
        primary_input_type: i.InputType.Number
    },
    isString: { fn: isString, config: {}, primary_input_type: i.InputType.String },
    isURL: { fn: isURL, config: {}, primary_input_type: i.InputType.String },
    isUUID: {
        fn: isUUID,
        config: { version: { type: FieldType.String } },
        primary_input_type: i.InputType.String
    },
    contains: {
        fn: contains,
        config: {
            value: { type: FieldType.String },
        },
        primary_input_type: i.InputType.Array
    },
    equals: {
        fn: equals,
        config: { value: { type: FieldType.String } },
        primary_input_type: i.InputType.Any
    },
    isAlpha: {
        fn: isAlpha,
        config: {
            locale: { type: FieldType.String }
        },
        primary_input_type: i.InputType.String
    },
    isAlphanumeric: {
        fn: isAlphanumeric,
        config: {
            locale: { type: FieldType.String }
        },
        primary_input_type: i.InputType.String
    },
    isASCII: { fn: isASCII, config: {}, primary_input_type: i.InputType.String },
    isBase64: { fn: isBase64, config: {}, primary_input_type: i.InputType.String },
    isEmpty: {
        fn: isEmpty,
        config: {
            ignoreWhitespace: { type: FieldType.Boolean }
        },
        primary_input_type: i.InputType.Any
    },
    isFQDN: {
        fn: isFQDN,
        config: {
            requireTld: { type: FieldType.Boolean },
            allowUnderscores: { type: FieldType.Boolean },
            allowTrailingDot: { type: FieldType.Boolean },
        },
        primary_input_type: i.InputType.String
    },
    isHash: {
        fn: isHash,
        config: {
            algo: { type: FieldType.String }
        },
        primary_input_type: i.InputType.String
    },
    isCountryCode: { fn: isCountryCode, config: {}, primary_input_type: i.InputType.String },
    isISO8601: { fn: isISO8601, config: {}, primary_input_type: i.InputType.String },
    isISSN: {
        fn: isISSN,
        config: {
            caseSensitive: { type: FieldType.Boolean },
            requireHyphen: { type: FieldType.Boolean }
        },
        primary_input_type: i.InputType.String
    },
    isRFC3339: { fn: isRFC3339, config: {}, primary_input_type: i.InputType.String },
    isJSON: { fn: isJSON, config: {}, primary_input_type: i.InputType.String },
    isLength: {
        fn: isLength,
        config: {
            size: { type: FieldType.Number },
            min: { type: FieldType.Number },
            max: { type: FieldType.Number },
        },
        primary_input_type: i.InputType.String
    },
    isMIMEType: { fn: isMIMEType, config: {}, primary_input_type: i.InputType.String },
    isPostalCode: {
        fn: isPostalCode,
        config: {
            locale: { type: FieldType.String }
        },
        primary_input_type: i.InputType.String
    },
    isRoutableIP: { fn: isRoutableIP, config: {}, primary_input_type: i.InputType.String },
    isNonRoutableIP: { fn: isNonRoutableIP, config: {}, primary_input_type: i.InputType.String },
    inIPRange: {
        fn: inIPRange,
        config: {
            min: { type: FieldType.String },
            max: { type: FieldType.String },
            cidr: { type: FieldType.String }
        },
        primary_input_type: i.InputType.String
    },
    isCIDR: { fn: isCIDR, config: {}, primary_input_type: i.InputType.String },
    exists: { fn: exists, config: {}, primary_input_type: i.InputType.Any },
    guard: { fn: guard, config: {}, primary_input_type: i.InputType.Any },
    isArray: { fn: isArray, config: {}, primary_input_type: i.InputType.Array },
    some: {
        fn: some,
        config: {
            fn: { type: FieldType.String },
            options: { type: FieldType.Object }
        },
        primary_input_type: i.InputType.Array
    },
    every: {
        fn: every,
        config: {
            fn: { type: FieldType.String },
            options: { type: FieldType.Object }
        },
        primary_input_type: i.InputType.Array
    },
};

function _lift(fn: any, input: unknown[], parentContext?: any, args?: any) {
    const sanitized = input.filter(isNotNil);
    if (sanitized.length === 0) return false;

    return sanitized.every((data) => fn(data, parentContext, args));
}

function handleArgs(fn: any) {
    return (data: any, _parentContext: unknown, args: any) => fn(data, args);
}

/**
 * Checks to see if input is a boolean.
 * If given an array, will check if all values are booleans
 *
 * @example
 * FieldValidator.isBoolean(false); // true
 * FieldValidator.isBoolean('astring'); // false
 * FieldValidator.isBoolean(0); // false
 * FieldValidator.isBoolean([true, undefined]); // true
 * FieldValidator.isBoolean(['true', undefined]; // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isBoolean(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(handleArgs(utilsIsBoolean), input, _parentContext);

    return utilsIsBoolean(input);
}

/**
 * Checks to see if input is a boolean-like value. If an given an array, it will check
 * to see if all values in the array are boolean-like, does NOT ignore null/undefined values
 *
 * @example
 * FieldValidator.isBooleanLike(); // true
 * FieldValidator.isBooleanLike(null); // true
 * FieldValidator.isBooleanLike(0); // true
 * FieldValidator.isBooleanLike('0'); // true
 * FieldValidator.isBooleanLike('false'); // true
 * FieldValidator.isBooleanLike('no'); // true
 * FieldValidator.isBooleanLike(['no', '0', null]); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isBooleanLike(input: unknown, _parentContext?: unknown): boolean {
    if (isArray(input)) return input.every(utilsIsBooleanLike);

    return utilsIsBooleanLike(input);
}

/**
 * Return true if value is a valid email, or a list of valid emails
 *
 * @example
 * FieldValidator.isEmail('ha3ke5@pawnage.com') // true
 * FieldValidator.isEmail('user@blah.com/junk.junk?a=<tag value="junk"') // true
 * FieldValidator.isEmail('email@example.com'); // true
 * FieldValidator.isEmail(12345); // false
 * FieldValidator.isEmail(['email@example.com', 'ha3ke5@pawnage.com']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isEmail(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(handleArgs(utilsIsEmail), input, _parentContext);

    return utilsIsEmail(input);
}

/**
 * Checks to see if input is a valid geo-point, or a list of valid geo-points
 * excluding null/undefined values
 *
 * @example
 * FieldValidator.isGeoPoint('60,80'); // true
 * FieldValidator.isGeoPoint([80, 60]); // true
 * FieldValidator.isGeoPoint({ lat: 60, lon: 80 }); // true
 * FieldValidator.isGeoPoint({ latitude: 60, longitude: 80 }); // true
 * FieldValidator.isGeoPoint(['60,80', { lat: 60, lon: 80 }]); // true
 * FieldValidator.isGeoPoint(['60,80', 'hello']); // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isGeoPoint(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;

    if (isArray(input) && !isNumberTuple(input)) {
        return _lift(handleArgs(parseGeoPoint), input, _parentContext, false);
    }

    // TODO: check for tuple vs an array of numbers
    const results = parseGeoPoint(input as any, false);
    return results != null;
}

/**
 * Checks to see if input is a valid geo-json geometry, or a list of geo-json geometries
 *
 * @example
 * FieldValidator.isGeoJSON('hello'); // false
 *
 * const polygon = {
 *   type: "Polygon",
 *   coordinates: [
 *       [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
 *   ]
 * };
 * FieldValidator.isGeoJSON(polygon); // true
 * FieldValidator.isGeoJSON([polygon, { other: 'obj'}]); // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isGeoJSON(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(handleArgs(utilsIsGeoJSON), input, _parentContext);

    return utilsIsGeoJSON(input);
}

/**
 * Checks to see if input is a valid geo-json point, or a list of geo-json points
 * @example
 * const polygon = {
 *   type: "Polygon",
 *   coordinates: [
 *      [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
 *    ]
 * };
 *
 * const point = {
 *   type: 'Point',
 *   coordinates: [12, 12]
 * };
 *
 * FieldValidator.isGeoShapePoint(polygon); // false
 * FieldValidator.isGeoShapePoint(point); // true
 * FieldValidator.isGeoShapePoint([polygon, point]); // false
 * FieldValidator.isGeoShapePoint([point, point]); // true
 *
 * @param {JoinGeoShape} input
 * @returns {boolean} boolean
 */

export function isGeoShapePoint(
    input: unknown, _parentContext?: unknown
): input is GeoShapePoint;
export function isGeoShapePoint(
    input: unknown[], _parentContext?: unknown
): input is GeoShapePoint[];
export function isGeoShapePoint(
    input: unknown, _parentContext?: unknown
): input is GeoShapePoint[] | GeoShapePoint {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(handleArgs(utilsIsGeoShapePoint), input, _parentContext);

    return utilsIsGeoShapePoint(input as any);
}

/**
 * Checks to see if input is a valid geo-json polygon or a list of geo-json polygons
 * @example
 * FieldValidator.isGeoShapePolygon(3); // false
 *
 * const polygon = {
 *   type: 'Polygon',
 *   coordinates: [
 *       [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
 *   ]
 * };
 *
 * const point = {
 *  type: 'Point',
 *   coordinates: [12, 12]
 * };
 *
 * FieldValidator.isGeoShapePolygon(polygon); // true
 * FieldValidator.isGeoShapePolygon(point); // false
 * FieldValidator.isGeoShapePolygon([polygon, point]); // false
 * FieldValidator.isGeoShapePolygon([polygon, polygon]); // true
 *
 * @param {JoinGeoShape} input
 * @returns {boolean} boolean
 */

export function isGeoShapePolygon(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(handleArgs(utilsIsGeoShapePolygon), input, _parentContext);

    return utilsIsGeoShapePolygon(input as any);
}

/**
 * Checks to see if input is a valid geo-json multi-polygon or a list of geo-json multi-polygons
 * @example
 *
 * const polygon = {
 *   type: "Polygon",
 *   coordinates: [
 *       [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
 *   ]
 * };
 *
 * const point = {
 *   type: 'Point',
 *   coordinates: [12, 12]
 * };
 *
 * const multiPolygon = {
 *   type: 'MultiPolygon',
 *   coordinates: [
 *       [
 *           [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
 *      ],
 *       [
 *           [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
 *       ]
 *   ]
 * };
 *
 * FieldValidator.isGeoShapeMultiPolygon(polygon); // false
 * FieldValidator.isGeoShapeMultiPolygon(point); // false
 * FieldValidator.isGeoShapeMultiPolygon(multiPolygon); // true
 * FieldValidator.isGeoShapeMultiPolygon([multiPolygon, multiPolygon]); // true
 * FieldValidator.isGeoShapeMultiPolygon([multiPolygon, point]); // false
 *
 * @param {JoinGeoShape} input
 * @returns {boolean} boolean
 */

export function isGeoShapeMultiPolygon(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) {
        return _lift(handleArgs(utilsIsGeoShapeMultiPolygon), input, _parentContext);
    }

    return utilsIsGeoShapeMultiPolygon(input as any);
}

/**
 * Validates that the input is an IP address, or a list of IP addresses
 *
 * @example
 *
 * FieldValidator.isIP('8.8.8.8'); // true
 * FieldValidator.isIP('192.172.1.18'); // true
 * FieldValidator.isIP('11.0.1.18'); // true
 * FieldValidator.isIP('2001:db8:85a3:8d3:1319:8a2e:370:7348'); // true
 * FieldValidator.isIP('fe80::1ff:fe23:4567:890a%eth2'); // true
 * FieldValidator.isIP('2001:DB8::1'); // true
 * FieldValidator.isIP('172.16.0.1'); // true
 * FieldValidator.isIP(['172.16.0.1', '11.0.1.18']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isIP(input: unknown, _parentContext?: unknown): input is string {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(isValidIP, input, _parentContext);

    return isValidIP(input);
}

function isValidIP(input: unknown, _parentContext?: unknown) {
    if (!isString(input)) return false;
    if (!utilsIsIP(input)) return false;

    return true;
}

/**
 * Validate is input is a routable IP, or a list of routable IP's
 *
 * @example
 *
 * FieldValidator.isRoutableIP('8.8.8.8'); // true
 * FieldValidator.isRoutableIP('2001:db8::1'); // true
 * FieldValidator.isRoutableIP('172.194.0.1'); // true
 * FieldValidator.isRoutableIP('100.127.255.250'); // false
 * FieldValidator.isRoutableIP('192.168.0.1'); // false
 * FieldValidator.isRoutableIP(['172.194.0.1', '8.8.8.8']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 *
 * see:
 *  https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
 *  https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml
 *  for ip range details
 */

export function isRoutableIP(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(_isRoutableIP, input, _parentContext);

    return _isRoutableIP(input);
}

function _isRoutableIP(input: unknown, _parentContext?: unknown): boolean {
    if (!isIP(input)) return false;

    return !_privateIP(input);
}

/**
 * Validate is input is a non-routable IP, or a list of non-routable IP's
 *
 * @example
 *
 * FieldValidator.isNonRoutableIP('192.168.0.1'); // true
 * FieldValidator.isNonRoutableIP('10.16.32.210'); // true
 * FieldValidator.isNonRoutableIP('fc00:db8::1'); // true
 * FieldValidator.isNonRoutableIP('8.8.8.8'); // false
 * FieldValidator.isNonRoutableIP('2001:db8::1'); // false
 * FieldValidator.isNonRoutableIP(['10.16.32.210', '192.168.0.1']); // true
 *
 * @param {*} input
 * @returns { boolean } boolean
 *
 * see:
 *  https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
 *  https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml
 *  for ip range details
 */

export function isNonRoutableIP(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(_isNonRoutableIP, input, _parentContext);

    return _isNonRoutableIP(input);
}

function _isNonRoutableIP(input: unknown, _parentContext?: unknown): boolean {
    if (!isIP(input)) return false;

    return _privateIP(input);
}

function _privateIP(input: string): boolean {
    const parsedIp = _parseIpAddress(input);

    const ipRangeName = parsedIp.range();

    return _inPrivateIPRange(ipRangeName) || _inRestrictedIPRange(parsedIp);
}

function _parseIpAddress(input: string) {
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

function _inPrivateIPRange(ipRange: string) {
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

function _inRestrictedIPRange(parsedIp: ipaddr.IPv4 | ipaddr.IPv6) {
    const rangesToCheck = parsedIp.kind() === 'ipv4' ? ipv4RestrictedRanges : ipv6RestrictedRanges;

    return rangesToCheck.some((ipRange) => parsedIp.match(ipRange));
}

/**
 * Validates that input is a cidr or a list of cidr values
 *
 * @example
 *
 * FieldValidator.isCIDR('8.8.0.0/12'); // true
 * FieldValidator.isCIDR('2001::1234:5678/128'); // true
 * FieldValidator.isCIDR('8.8.8.10'); // false
 * FieldValidator.isCIDR(['8.8.0.0/12', '2001::1234:5678/128']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isCIDR(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(_isCidr, input, _parentContext);

    return _isCidr(input);
}

function _isCidr(input: unknown, _parentContext?: unknown): boolean {
    if (!isString(input)) return false;
    return isNonZeroCidr(input);
}

/**
 * Validates if the input is within a given range of IP's
 * @example
 * FieldValidator.inIPRange('8.8.8.8', {}, { cidr: '8.8.8.0/24' }); // true
 * FieldValidator.inIPRange('fd00::b000', {}, { min: 'fd00::123', max: 'fd00::ea00' }); // true;
 * FieldValidator.inIPRange('8.8.8.8', {}, { cidr: '8.8.8.10/32' }); // false
 *
 * const config = { min: '8.8.8.0', max: '8.8.8.64' };
 * FieldValidator.inIPRange(['8.8.8.64', '8.8.8.8'], {}, config); // true
 *
 * @param {*} input
 * @param {{ min?: string; max?: string; cidr?: string }} args
 * @returns {boolean} boolean
 */

export function inIPRange(
    input: unknown, _parentContext: unknown, args: { min?: string; max?: string; cidr?: string }
): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(_inIPRange, input, _parentContext, args);

    return _inIPRange(input, args);
}

function _inIPRange(input: unknown, args: { min?: string; max?: string; cidr?: string }) {
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
    if (!min) min = isIPv6(input) ? MIN_IPV6_IP : MIN_IPV4_IP;
    if (!max) max = isIPv6(input) ? MAX_IPV6_IP : MAX_IPV4_IP;

    // min and max must be valid ips, same IP type, and min < max
    if (!isIP(min) || !isIP(max) || isIPv6(min) !== isIPv6(max)
        || ip6addr.compare(max, min) === -1) {
        return false;
    }

    return ip6addr.createAddrRange(min, max).contains(input);
}

/**
 * Validates that the input is a valid phone number, or a list of phone numbers
 *
 * @example
 * FieldValidator.isISDN('46707123456'); // true
 * FieldValidator.isISDN('1-808-915-6800'); // true
 * FieldValidator.isISDN('NOT A PHONE Number'); // false
 * FieldValidator.isISDN(79525554602); // true
 * FieldValidator.isISDN(['46707123456', '1-808-915-6800']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isISDN(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) {
        const fn = (data: any) => {
            const phoneNumber = parsePhoneNumber(`+${data}`);
            return phoneNumber.valid;
        };

        return _lift(fn, input, _parentContext);
    }

    const phoneNumber = parsePhoneNumber(`+${input}`);
    return phoneNumber.valid;
}

interface MACAddressArgs {
    delimiter?: MACDelimiter;
}

/**
 * Validates that the input is a MacAddress, or a list of MacAddresses
 *
 * @example
 * FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f'); // true
 * FieldValidator.isMACAddress('001ff35b2b1f'); // true
 * FieldValidator.isMACAddress('001f.f35b.2b1f',{}, { delimiter: 'dot' }); // true
 *
 * const manyDelimiters = { delimiter: 'any' }
 * FieldValidator.isMACAddress('00-1f-f3-5b-2b-1f', {}, manyDelimiters); // true
 * FieldValidator.isMACAddress(12345); // false
 *
 * // specified colon and space delimiter only
 * const twoDelimiters = { delimiter: 'any };
 * FieldValidator.isMACAddress('00-1f-f3-5b-2b-1f', {}, twoDelimiters ); // false,
 * FieldValidator.isMACAddress(['001ff35b2b1f', '00:1f:f3:5b:2b:1f']); // true
 *
 * @param {*} input
 * @param {{delimiter}} [{ delimiter?: string}] may be set to 'colon'|'space'|'dash'|'dot'|'none'
 * @returns {boolean} boolean
 */

export function isMACAddress(
    input: unknown, _parentContext?: unknown, args?: MACAddressArgs
): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) {
        return _lift(isMACAddressFP(args?.delimiter), input, _parentContext);
    }

    return utilsIsMacAddress(input, args?.delimiter);
}

/**
 * Will return true if number is between args provided, or that the list
 * of numbers are between the values
 *
 * @example
 * FieldValidator.inNumberRange(42, {}, { min: 0, max: 100}); // true
 * FieldValidator.inNumberRange([42, 11, 94], {}, { min: 0, max: 100}); // true
 * FieldValidator.inNumberRange([42, 11367, 94], {}, { min: 0, max: 100}); // false
 * FieldValidator.inNumberRange(-42, {}, { min:0 , max: 100 }); // false
 * FieldValidator.inNumberRange(42, {}, { min: 0, max: 42 }); // false without the inclusive option
 * FieldValidator.inNumberRange(42, {}, { min: 0, max: 42, inclusive: true }) // true with inclusive
 *
 * @param {number} input
 * @param {{ min?: number; max?: number; inclusive?: boolean }} args
 * @returns {boolean} boolean
 */

export function inNumberRange(
    input: unknown,
    _parentContext: unknown,
    args: { min?: number; max?: number; inclusive?: boolean }
): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) {
        return _lift(inNumberRangeFP(args), input, _parentContext);
    }

    return utilsInNumberRange(input, args);
}

/**
 * Validates that input is a number or a list of numbers
 *
 * @example
 * FieldValidator.isNumber(42.32); // true
 * FieldValidator.isNumber('NOT A Number'); // false
 * FieldValidator.isNumber([42.32, 245]); // true
 * FieldValidator.isNumber([42.32, { some: 'obj' }]); // false
 * FieldValidator.isNumber('1'); // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isNumber(input: unknown, _parentContext?: unknown): input is number {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(handleArgs(utilsIsNumber), input, _parentContext);

    return utilsIsNumber(input);
}

/**
 * Validates that input is a integer or a list of integers
 *
 * @example
 * FieldValidator.isInteger(42); // true
 * FieldValidator.isInteger(3.14); // false
 * FieldValidator.isInteger(Infinity); // false
 * FieldValidator.isInteger('1'); // false
 * FieldValidator.isInteger(true); //false
 * FieldValidator.isInteger([42, 1]); // true
 * FieldValidator.isInteger([42, 3.14]); // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isInteger(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(handleArgs(utilsIsInteger), input, _parentContext);

    return utilsIsInteger(input);
}

/**
 * Validates that input is a string or a list of strings
 *
 * @example
 * FieldValidator.isString('this is a string'); // true
 * FieldValidator.isString(true); // false
 * FieldValidator.isString(['hello', 'world']); // true
 * FieldValidator.isString(['hello', 3]); // false
 * FieldValidator.isString(17.343); // false
 *
 * @param {*} input
 */

export function isString(input: unknown, _parentContext?: unknown): input is string {
    if (isNil(input)) return false;
    if (isArray(input)) return _lift(handleArgs(utilsIsString), input, _parentContext);

    return utilsIsString(input);
}

/**
 * Validates that the input is a url or a list of urls
 *
 * @example
 * FieldValidator.isURL('https://someurl.cc.ru.ch'); // true
 * FieldValidator.isURL('ftp://someurl.bom:8080?some=bar&hi=bob'); // true
 * FieldValidator.isURL('http://xn--fsqu00a.xn--3lr804guic'); // true
 * FieldValidator.isURL('http://example.com'); // true
 * FieldValidator.isURL('BAD-URL'); // false
 * FieldValidator.isURL(['http://example.com', 'http://example.com']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isURL(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && url.isUri(data) !== null;
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && url.isUri(input) != null;
}

/**
 * Validates that input is a UUID or a list of UUID's
 *
 * @example
 * FieldValidator.isUUID('0668CF8B-27F8-2F4D-AF2D-763AC7C8F68B'); // true
 * FieldValidator.isUUID('BAD-UUID'); // false
 * FieldValidator.isUUID([
 *   '0668CF8B-27F8-2F4D-AF2D-763AC7C8F68B',
 *   '123e4567-e89b-82d3-A456-426655440000'
 * ]); // true
 *
 * @param {*} input
 * @param {{ version: validator.UUIDVersion }} [args]
 * @returns {boolean} boolean
 */

export function isUUID(input: unknown, _parentContext?: unknown, args?: { version: validator.UUIDVersion }): boolean {
    if (isNil(input)) return false;

    const version: validator.UUIDVersion = args && args.version ? args.version : 'all';

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isUUID(data);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isUUID(input, version);
}

/**
 * Validates the input contains the values specified in args,
 * or that the array of inputs contains the value in args
 *
 * @example
 * FieldValidator.contains('hello', {}, { value: 'hello' }); // true
 * FieldValidator.contains('hello', {}, { value: 'll' }); // true
 * FieldValidator.contains(['hello', 'cello'], {}, { value: 'll' }); // true
 * FieldValidator.contains(['hello', 'stuff'], {}, { value: 'll' }); // false
 * FieldValidator.contains('12345', {}, { value: '45' }); // true
 *
 * @param {*} input
 * @param {{ value: string }} { value }
 * @returns {boolean} boolean
 */

export function contains(
    input: unknown, _parentContext: unknown, args: { value: string }
): boolean {
    if (isNil(input)) return false;
    if (!args.value) throw new Error('Parameter value must provided');

    if (isArray(input)) {
        const fn = (data: any) => includes(data, args.value);
        return _lift(fn, input, _parentContext);
    }

    return includes(input, args.value);
}

/**
 * Validates that the input matches the value, of that the input array matches the value provided
 *
 * @example
 * FieldValidator.equals('12345', {}, { value: '12345' }); // true
 * FieldValidator.equals('hello', {}, { value: 'llo' }); // false
 * FieldValidator.equals([3, 3], { value: 3 }); // true
 *
 * @param {*} input
 * @param {{ value: string }} { value }
 * @returns {boolean} boolean
 */

export function equals(input: unknown, _parentContext: unknown, args: { value: string }): boolean {
    if (isNil(input)) return false;
    if (!args.value) throw new Error('A value must provided with the input');

    if (isArray(input)) {
        const fn = (data: any) => isDeepEqual(data, args.value);
        return _lift(fn, input, _parentContext);
    }

    return isDeepEqual(input, args.value);
}

/**
 * Validates that the input is alpha or a list of alpha values
 *
 * @example
 * FieldValidator.isAlpha('ThiSisAsTRing'); // true
 * FieldValidator.isAlpha('ThisiZĄĆĘŚŁ', {}, { locale: 'pl-Pl' }); // true
 * FieldValidator.isAlpha('1123_not-valid'); // false
 * FieldValidator.isAlpha(['validString', 'more']); // true
 *
 * @param {*} input
 * @param {{ locale: validator.AlphaLocale }} [args]
 * @returns {boolean} boolean
 */

export function isAlpha(
    input: unknown, _parentContext?: unknown, args?: { locale: validator.AlphaLocale }
): boolean {
    if (isNil(input)) return false;

    const locale: validator.AlphaLocale = args && args.locale ? args.locale : 'en-US';

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isAlpha(data, locale);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isAlpha(input, locale);
}

/**
 * Validates that the input is alphanumeric or a list of alphanumeric values
 *
 * @example
 *
 * FieldValidator.isAlphanumeric('123validString'); // true
 * FieldValidator.isAlphanumeric('فڤقکگ1234', { locale: 'ku-IQ' }); // true
 * FieldValidator.isAlphanumeric('-- not valid'); // false
 * FieldValidator.isAlphanumeric(['134', 'hello']); // true
 *
 * @param {*} input
 * @param {{ locale: validator.AlphanumericLocale }} [args]
 * @returns {boolean} boolean
 */

export function isAlphanumeric(
    input: unknown,
    _parentContext?: unknown,
    args?: { locale: validator.AlphanumericLocale }
): boolean {
    if (isNil(input)) return false;

    const locale: validator.AlphanumericLocale = args && args.locale ? args.locale : 'en-US';

    if (isArray(input)) {
        const fn = (data: any) => isString(data) && validator.isAlphanumeric(data, locale);
        return _lift(fn, input, _parentContext);
    }

    return isString(input) && validator.isAlphanumeric(input, locale);
}

/**
 * Validates that the input is ascii chars or a list of ascii chars
 *
 * @example
 *
 * FieldValidator.isASCII('ascii\s__'); // true;
 * FieldValidator.isASCII('˜∆˙©∂ß'); // false
 * FieldValidator.isASCII(['some', 'words']); // true;
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isASCII(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isAscii(data);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isAscii(input);
}

/**
 * Validates that the input is a base64 encoded string or a list of base64
 * encoded strings of string or binary data
 *
 * @example
 * FieldValidator.isBase64('H4sIADYPj2YAAytJLS4x4gIA2GR0VwYAAAA='); // true
 * FieldValidator.isBase64('not base 64'); // false\
 * FieldValidator.isBase64(['H4sIADYPj2YAAytJLS4x4gIA2GR0VwYAAAA=',
 *                                'H4sIAFIPj2YAAytJLS4x5AIAGzdZfAYAAAA=']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isBase64(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => _validBase64(data);
        return _lift(fn, input, _parentContext);
    }

    return _validBase64(input);
}

function _validBase64(input: unknown): boolean {
    if (utilsIsString(input)) {
        const validatorValid = validator.isBase64(input);
        const validatorValidUrl = validator.isBase64(input, { urlSafe: true });
        // validator does not include pad char(=)
        const base64URLPaddedRegex = /^[A-Z0-9_\-=]*$/i;
        const validatorValidUrlPadded = base64URLPaddedRegex.test(input);
        if (validatorValid || validatorValidUrl || validatorValidUrlPadded) {
            const decode = Buffer.from(input, 'base64');
            const encode = Buffer.from(decode).toString('base64');
            return input === encode;
        }
    }

    return false;
}

/**
 * Validates that the input is empty
 * @example
 * FieldValidator.isEmpty(''); // true
 * FieldValidator.isEmpty(undefined); // true
 * FieldValidator.isEmpty(null); // true
 * FieldValidator.isEmpty({ foo: 'bar' }); // false
 * FieldValidator.isEmpty({}); // true
 * FieldValidator.isEmpty([]); // true
 * FieldValidator.isEmpty('     ', {}, { ignoreWhitespace: true }); // true
 *
 * @param {*} input
 * @param {{ ignoreWhitespace: boolean }} [args] set to true if you want the value to be trimmed
 * @returns {boolean} boolean
 */

export function isEmpty(
    input: unknown, _parentContext?: unknown, args?: { ignoreWhitespace: boolean }
): boolean {
    let value = input;

    if (!isArray(value) && utilsIsString(value) && args && args.ignoreWhitespace) {
        value = value.trim();
    }

    return utilsIsEmpty(value);
}

/**
 * Validate that the input is a valid domain name, or a list of domain names
 *
 * @example
 *
 * FieldValidator.isFQDN('example.com.uk'); // true
 * FieldValidator.isFQDN('notadomain'); // false
 * FieldValidator.isFQDN(['example.com.uk', 'google.com']); // true
 *
 * @param {*} input
 * @param {args} [{ require_tld = true, allow_underscores = false, allow_trailing_dot = false}]
 * @returns {boolean} boolean
 */

export function isFQDN(input: unknown, _parentContext?: unknown, args?: FQDNOptions): boolean {
    if (isNil(input)) return false;

    const config = {
        require_tld: args?.requireTld || true,
        allow_underscores: args?.allowUnderscores || false,
        allow_trailing_dot: args?.allowTrailingDot || false
    };

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isFQDN(data, config);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isFQDN(input, config);
}

/**
 * Validates that the input is a hash, or a list of hashes
 *
 * @example
 * const md5Config = { algo: 'md5'};
 * const sha256Config = { algo: 'sha256' }
 * const sha1Config = { algo: 'sha1' }
 *
 * FieldValidator.isHash('6201b3d1815444c87e00963fcf008c1e', {}, { algo: 'md5' }); // true
 * FieldValidator.isHash(
 * '85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33',
 * {},
 * { algo: 'sha256' }
 * ); // true
 *
 * FieldValidator.isHash('98fc121ea4c749f2b06e4a768b92ef1c740625a0', {}, { algo: 'sha1' }); // true
 * FieldValidator.isHash(['6201b3d1815444c87e00963fcf008c1e', undefined],
 *  {},
 *   { algo: 'md5' }
 * ); // true
 *
 * @param {*} input
 * @param {HashConfig} { algo }
 * @returns {boolean} boolean
 */

export function isHash(input: unknown, _parentContext: unknown, args: HashConfig): boolean {
    if (isNil(input)) return false;
    if (args?.algo === undefined) throw new Error('Parameter property algo was not provided');

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isHash(data, args.algo);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isHash(input, args.algo);
}

/**
 * Validates that input is a valid country code or a list of country codes
 *
 * @example
 *
 * FieldValidator.isCountryCode('IS'); // true
 * FieldValidator.isCountryCode('ru'); // true
 * FieldValidator.isCountryCode('USA'); // false
 * FieldValidator.isCountryCode(['IS', 'ru']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isCountryCode(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isISO31661Alpha2(data);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isISO31661Alpha2(input);
}

/**
 * Checks to see if input is a valid ISO8601 string dates or a list of valid dates
 * @example
 * FieldValidator.isISO8601('2020-01-01T12:03:03.494Z'); // true
 * FieldValidator.isISO8601('2020-01-01'); // true
 * FieldValidator.isISO8601('2020-01-01T12:03:03'); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isISO8601(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isISO8601(data);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isISO8601(input);
}

/**
 * Validates that input is a valid ISSN or a list of valid ISSN
 *
 * @example
 *
 * FieldValidator.isISSN('0378-5955'); // true
 * FieldValidator.isISSN('03785955'); // true
 * FieldValidator.isISSN('0378-5955', {}, { requireHyphen: true }); // true
 * FieldValidator.isISSN(['0378-5955', '0000-006x']); // true
 *
 * @param {*} input
 * @param {ArgsISSNOptions} [{ requireHyphen?: boolean; caseSensitive?: boolean;}]
 * @returns {boolean} boolean
 */

export function isISSN(input: unknown, _parentContext?: unknown, args?: ArgsISSNOptions): boolean {
    if (isNil(input)) return false;

    const config = {
        case_sensitive: args?.caseSensitive || false,
        require_hyphen: args?.requireHyphen || false
    };

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isISSN(data, config);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isISSN(input, config);
}

/**
 * Validates that input is a valid RFC3339 dates or a list of valid RFC3339 dates
 *
 * @example
 * FieldValidator.isRFC3339('2020-01-01T12:05:05.001Z'); // true
 * FieldValidator.isRFC3339('2020-01-01 12:05:05.001Z'); // true
 * FieldValidator.isRFC3339('2020-01-01T12:05:05Z'); // true
 * FieldValidator.isRFC3339(['2020-01-01T12:05:05Z', '2020-01-01T12:05:05.001Z']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isRFC3339(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isRFC3339(data);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isRFC3339(input);
}

/**
 * Validates that input is a valid JSON string or a list of valid JSON
 *
 * @example
 * FieldValidator.isJSON('{ "bob": "gibson" }'); // true
 * FieldValidator.isJSON({ bob: 'gibson' }); // false
 * FieldValidator.isJSON('[]'); // true
 * FieldValidator.isJSON('{}'); // true
 * FieldValidator.isJSON(['{ "bob": "gibson" }', '[]']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isJSON(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isJSON(data);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isJSON(input);
}

/**
 * Check to see if input is a string with given length ranges, or a list of valid string lengths
 * @example
 * FieldValidator.isLength('astring', { size: 7 }); // true
 * FieldValidator.isLength('astring', { min: 3, max: 10 }); // true
 * FieldValidator.isLength('astring', { size: 10 }); // false
 * FieldValidator.isLength('astring', {}, { min: 8 }); // false
 * FieldValidator.isLength(['astring', 'stuff', 'other'], { min: 3, max: 10 }); // true
 *
 * @param {*} input
 * @param {LengthConfig} { size, min, max }
 * @returns {boolean} boolean
 */

export function isLength(
    input: unknown, _parentContext: unknown, { size, min, max }: LengthConfig
): boolean {
    if (isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => {
            if (size) return utilsIsString(data) && data.length === size;
            if (min || max) return validator.isLength(data, { min, max });
            return false;
        };
        return _lift(fn, input, _parentContext);
    }

    if (isString(input)) {
        if (size) return input.length === size;
        if (min || max) return validator.isLength(input, { min, max });
    }

    return false;
}

/**
 * Validates that input is a valid mimeType or a list of mimeTypes
 *
 * @example
 *
 * FieldValidator.isMIMEType('application/javascript'); // true
 * FieldValidator.isMIMEType('application/graphql'); // true
 * FieldValidator.isMIMEType(12345); // false
 * FieldValidator.isMIMEType(['application/graphql', 'application/javascript']); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isMIMEType(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isMimeType(data);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isMimeType(input);
}

/**
 * Validates that input is a valid postal code or a list of postal codes
 *
 * @example
 *
 * FieldValidator.isPostalCode('85249'); // true
 * FieldValidator.isPostalCode('85249', {}, { locale: 'any' }); // true
 * FieldValidator.isPostalCode('85249', {}, { locale: 'ES' }); // false
 * FieldValidator.isPostalCode('852', {}, { locale: 'IS' }); // true
 * FieldValidator.isPostalCode('885 49', {}, { locale: 'SE' }); // true
 * FieldValidator.isPostalCode(1234567890); // false
 * FieldValidator.isPostalCode(['85249']); // true
 *
 * @param {*} input
 * @param {({ locale: 'any' | PostalCodeLocale })} { locale }
 * @returns {boolean} boolean
 */

export function isPostalCode(input: unknown, _parentContext: unknown, args: { locale: 'any' | PostalCodeLocale }): boolean {
    if (isNil(input)) return false;
    if (!args?.locale) throw new Error('Invalid parameter locale, must provide an object with locale');

    if (isArray(input)) {
        const fn = (data: any) => utilsIsString(data) && validator.isPostalCode(data, args.locale);
        return _lift(fn, input, _parentContext);
    }

    return utilsIsString(input) && validator.isPostalCode(input, args.locale);
}

/**
 * Validates that the input is a valid date or a list of valid dates
 *
 * @example
 * FieldValidator.isValidDate('2019-03-17T23:08:59.673Z'); // true
 * FieldValidator.isValidDate('2019-03-17'); // true
 * FieldValidator.isValidDate('2019-03-17T23:08:59'); // true
 * FieldValidator.isValidDate('03/17/2019'); // true
 * FieldValidator.isValidDate('03-17-2019'); // true
 * FieldValidator.isValidDate('Jan 22, 2012'); // true
 * FieldValidator.isValidDate('23 Jan 2012'); // true
 * FieldValidator.isValidDate(1552000139); // true
 * FieldValidator.isValidDate('1552000139'); // false
 * FieldValidator.isValidDate(['2019-03-17', 1552000139]); // true;
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isValidDate(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) return false;

    if (isArray(input)) {
        return _lift(handleArgs(utilsIsValidDate), input, _parentContext);
    }

    return !utilsIsBoolean(input as any) && utilsIsValidDate(input);
}

/**
 * Will throw if input is null or undefined
 *
 * @example
 *
 * FieldValidator.guard({ hello: 'world' }); // true
 * FieldValidator.guard(); // WILL THROW
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function guard(input: unknown, _parentContext?: unknown): boolean {
    if (isNil(input)) throw new Error('Expected value not to be empty');
    return true;
}

/**
 * Will return false if input is null or undefined
 *
 * @example
 *
 * FieldValidator.exists({ hello: 'world' }); // true
 * FieldValidator.exists(null); // false
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function exists(input: unknown, _parentContext?: unknown): boolean {
    return isNotNil(input);
}

/**
 * Validates that the input is an array
 * @example
 * FieldValidator.isArray(undefined); // false
 * FieldValidator.isArray([1, 2, 3]); // true
 * FieldValidator.isArray([]); // true
 *
 * @param {*} input
 * @returns {boolean} boolean
 */

export function isArray(input: unknown, _parentContext?: unknown): input is any[] {
    return isArrayLike(input);
}

/**
 * Validates that the function specified returns true at least once on the list of values
 *
 * @example
 *
 * const mixedArray = ['hello', 3, { some: 'obj' }];
 * FieldValidator.some(mixedArray, mixedArray, fn: 'isString' }); // true
 * FieldValidator.some(mixedArray, mixedArray, { fn: 'isBoolean' }); // false
 *
 * @param {*} input
 * @param {{ fn: string; options?: any }} { fn, options } fn is the name of method on FieldValidator
 * options is any other arguments necessary for that function call
 * @returns {boolean} boolean
 */

export function some(
    input: unknown, _parentContext: unknown, { fn, options }: { fn: string; options?: any }
): boolean {
    if (!isArray(input)) return false;

    const repoConfig = repository[fn];
    if (!repoConfig) throw new Error(`No function ${fn} was found in the field validator repository`);

    return input.some((data: any) => repoConfig.fn(data, data, options));
}

/**
 * Validates that the function specified returns true for every single value in the list
 *
 * @example
 * const mixedArray = ['hello', 3, { some: 'obj' }];
 * const strArray = ['hello', 'world'];
 *
 * FieldValidator.every([mixedArray, mixedArray { fn: 'isString' }); // false
 * FieldValidator.every(strArray, strArray, { fn: 'isString' }); // true
 *
 * @param {*} input
 * @param {{ fn: string; options?: any }} { fn, options } fn is the name of method on FieldValidator
 * options is any other arguments necessary for that function call
 * @returns {boolean} boolean
 */

export function every(
    input: unknown, _parentContext: unknown, { fn, options }: { fn: string; options?: any }
): boolean {
    if (!isArray(input)) return false;

    const repoConfig = repository[fn];
    if (!repoConfig) throw new Error(`No function ${fn} was found in the field validator repository`);

    return input.every((data: any) => repoConfig.fn(data, data, options));
}

export function isNumberTuple(input: unknown, _parentContext?: unknown): boolean {
    if (Array.isArray(input) && input.length === 2) {
        return input.every(utilsIsNumber);
    }

    return false;
}
