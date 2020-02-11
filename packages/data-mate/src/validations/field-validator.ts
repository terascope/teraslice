import * as ts from '@terascope/utils';
import ipaddr from 'ipaddr.js';
import { isIP as checkIP, isIPv6 } from 'net';
// @ts-ignore
import ip6addr from 'ip6addr';
import isCidr from 'is-cidr';
import PhoneValidator from 'awesome-phonenumber';
import validator from 'validator';
import * as url from 'valid-url';
import {
    FQDNOptions,
    HashConfig,
    LengthConfig,
    PostalCodeLocale,
    IssnOptions,
    MACAddress
} from './interfaces';
import { parseGeoPoint } from '../transforms/helpers';
import * as i from '../interfaces';

const geoJSONTypes = Object.keys(i.GeoShapeType).map((key) => key.toLowerCase());

export const respoitory: i.Repository = {
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
    isMacAddress: { fn: isMacAddress, config: { delimiter: { type: 'Array!' } } },
    isNumber: { fn: isNumber, config: {} },
    isInteger: { fn: isInteger, config: {} },
    inNumberRange: { fn: inNumberRange, config: { min: { type: 'Number!' }, max: { type: 'Number!' } } },
    isString: { fn: isString, config: {} },
    isUrl: { fn: isUrl, config: {} },
    isUUID: { fn: isUUID, config: {} },
    contains: { fn: contains, config: { value: { type: 'String!' } } },
    equals: { fn: equals, config: { value: { type: 'String!' } } },
    isAlpha: { fn: isAlpha, config: {} },
    isAlphanumeric: { fn: isAlphanumeric, config: {} },
    isAscii: { fn: isAscii, config: {} },
    isBase64: { fn: isBase64, config: {} },
    isEmpty: { fn: isEmpty, config: {} },
    isFQDN: { fn: isFQDN, config: {} }, // TODO:
    isHash: { fn: isHash, config: {} },
    isCountryCode: { fn: isCountryCode, config: {} },
    isISO8601: { fn: isISO8601, config: {} },
    isISSN: { fn: isISSN, config: {} },
    isRFC3339: { fn: isRFC3339, config: {} },
    isJSON: { fn: isJSON, config: {} },
    isLength: { fn: isLength, config: {} },
    isMimeType: { fn: isMimeType, config: {} },
    isPostalCode: { fn: isPostalCode, config: {} },
    isRoutableIp: { fn: isRoutableIP, config: {} },
    isNonRoutableIP: { fn: isNonRoutableIP, config: {} },
    inIPRange: { fn: inIPRange, config: { min: { type: 'String!' }, max: { type: 'String!' }, cidr: { type: 'String!' } } },
    isDefined: { fn: isDefined, config: { } }
};

export function isBoolean(input: any): boolean {
    return ts.isBoolean(input);
}

export function isBooleanLike(input: any): boolean {
    return ts.isBooleanLike(input);
}

export function isEmail(input: any): boolean {
    // Email Validation as per RFC2822 standards. Straight from .net helpfiles
    // eslint-disable-next-line
    const regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    if (ts.isString(input) && input.toLowerCase().match(regex)) return true;

    return false;
}

export function isGeoPoint(input: any) {
    const results = parseGeoPoint(input, false);
    return results != null;
}

export function isGeoJSON(input: any) {
    return ts.isPlainObject(input)
        && Array.isArray(input.coordinates)
        && geoJSONTypes.includes(input.type.toLowerCase());
}

export function isGeoShapePoint(input: i.JoinGeoShape) {
    return isGeoJSON(input)
    && (input.type === i.GeoShapeType.Point || input.type === i.ESGeoShapeType.Point);
}

export function isGeoShapePolygon(input: i.JoinGeoShape) {
    return isGeoJSON(input)
    && (input.type === i.GeoShapeType.Polygon || input.type === i.ESGeoShapeType.Polygon);
}

export function isGeoShapeMultiPolygon(input: i.JoinGeoShape) {
    return isGeoJSON(input)
    && (input.type === i.GeoShapeType.MultiPolygon || input.type === i.ESGeoShapeType.MultiPolygon);
}

export function isIP(input: any) {
    if (checkIP(input) === 0) return false;

    // needed to check for inputs like - '::192.168.1.18'
    if (input.includes(':') && input.includes('.')) return false;

    return true;
}

export function isRoutableIP(input: any, args?: { non_routable: boolean }): boolean {
    if (!isIP(input)) return false;

    const range = ipaddr.parse(input).range();

    const nonRoutable = range === 'private' || range === 'uniqueLocal';

    if (args && args.non_routable) return nonRoutable;

    return !nonRoutable;
}

export function isNonRoutableIP(input: any): boolean {
    return isRoutableIP(input, { non_routable: true });
}

export function isIPCidr(input: any) {
    if (isCidr(input) > 0) return true;

    return false;
}

export function inIPRange(input: any, args: { min?: string; max?: string; cidr?: string }) {
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

export function isISDN(input: any): boolean {
    const phoneNumber = new PhoneValidator(`+${input}`);
    return phoneNumber.isValid();
}

export function isMacAddress(input: any, args?: MACAddress): boolean {
    if (!isString(input)) return false;

    const delimiters = {
        colon: /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/,
        space: /^([0-9a-fA-F][0-9a-fA-F]\s){5}([0-9a-fA-F][0-9a-fA-F])$/,
        dash: /^([0-9a-fA-F][0-9a-fA-F]-){5}([0-9a-fA-F][0-9a-fA-F])$/,
        dot: /^([0-9a-fA-F]{4}\.){2}([0-9a-fA-F]{4})$/,
        none: /^([0-9a-fA-F]){12}$/
    };

    const delimiter = args && args.delimiter ? args.delimiter : 'any';

    if (delimiter === 'any') {
        return Object.keys(delimiters).some((d) => delimiters[d].test(input));
    }

    if (Array.isArray(delimiter)) {
        return delimiter.some((d) => delimiters[d].test(input));
    }

    return delimiters[delimiter].test(input);
}

export function inNumberRange(input: number,
    args: { min?: number; max?: number; inclusive?: boolean }): boolean {
    const min = args.min ? args.min : -Infinity;
    const max = args.max ? args.max : Infinity;

    if (args.inclusive) {
        return (input >= min && input <= max);
    }

    return (input > min && input < max);
}

export function isNumber(input: any): input is number {
    return ts.isNumber(input);
}

export function isInteger(input: any): boolean {
    return ts.isInteger(input);
}

export function isString(input: any): boolean {
    return ts.isString(input);
}

export function isUrl(input: any): boolean {
    if (!isString(input) || url.isUri(input) == null) return false;

    return true;
}

export function isUUID(input: any): boolean {
    return isString(input) && validator.isUUID(input);
}

export function contains(input: any, { value }: { value: string }): boolean {
    return isString(input) && input.includes(value);
}
// TODO: should this do more
export function equals(input: any, { value }: { value: string }): boolean {
    return isString(input) && input === value;
}

export function isAlpha(input: any, args?: { locale: validator.AlphaLocale }): boolean {
    const locale: validator.AlphaLocale = args && args.locale ? args.locale : 'en-US';
    return isString(input) && validator.isAlpha(input, locale);
}

export function isAlphanumeric(input: any,
    args?: { locale: validator.AlphanumericLocale }): boolean {
    const locale: validator.AlphanumericLocale = args && args.locale ? args.locale : 'en-US';
    return isString(input) && validator.isAlphanumeric(input, locale);
}

export function isAscii(input: any): boolean {
    return isString(input) && validator.isAscii(input);
}

export function isBase64(input: any): boolean {
    return isString(input) && validator.isBase64(input);
}

export function isEmpty(input: any, args?: { ignore_whitespace: boolean }): boolean {
    let value = input;

    if (isString(value) && args && args.ignore_whitespace) {
        value = value.trim();
    }

    return ts.isEmpty(value);
}

export function isFQDN(input: any, config?: FQDNOptions): boolean {
    return isString(input) && validator.isFQDN(input, config);
}

export function isHash(input: any, { algo }: HashConfig): boolean {
    return isString(input) && validator.isHash(input, algo);
}

export function isCountryCode(input: any): boolean {
    return isString(input) && validator.isISO31661Alpha2(input);
}

export function isISO8601(input: any): boolean {
    return isString(input) && validator.isISO8601(input);
}

export function isISSN(input: any, args?: IssnOptions): boolean {
    return isString(input) && validator.isISSN(input, args);
}

export function isRFC3339(input: any): boolean {
    return isString(input) && validator.isRFC3339(input);
}

export function isJSON(input: any): boolean {
    return isString(input) && validator.isJSON(input);
}

export function isLength(input: any, { size, min, max }: LengthConfig) {
    if (isString(input)) {
        if (size) return input.length === size;
        if (min || max) return validator.isLength(input, { min, max });
    }
    return false;
}

export function isMimeType(input: any): boolean {
    return isString(input) && validator.isMimeType(input);
}

export function isPostalCode(input: any, { locale }: { locale: 'any' | PostalCodeLocale }): boolean {
    return isString(input) && validator.isPostalCode(input, locale);
}

export function isValidDate(input: any): boolean {
    return !isBoolean(input) && ts.isValidDate(input);
}

export function isDefined(input: any): boolean {
    return input != null;
}
