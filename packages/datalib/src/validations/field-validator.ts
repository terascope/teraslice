import * as ts from '@terascope/utils';
import ipaddr from 'ipaddr.js';
import { isIP as checkIp } from 'net';
import PhoneValidator from 'awesome-phonenumber';
import validator from 'validator';
import * as url from 'valid-url';
import {
    FQDNOptions,
    HashConfig,
    LengthConfig,
    PostalCodeLocale
} from './interfaces';
import { parseGeoPoint } from '../transforms/helpers';
import * as i from '../interfaces';

const geoJSONTypes = Object.keys(i.GeoShapeType).map((key) => key.toLowerCase());

export const respoitory: i.Repository = {
    isBoolean: { fn: isBoolean, config: {} },
    isBooleanLike: { fn: isBooleanLike, config: {} },
    isEmail: { fn: isEmail, config: {} },
    validValue: { fn: validValue, config: {} },
    isGeoJSON: { fn: isGeoJSON, config: {} },
    isGeoPoint: { fn: isGeoPoint, config: {} },
    isGeoShapePoint: { fn: isGeoShapePoint, config: {} },
    isGeoShapePolygon: { fn: isGeoShapePolygon, config: {} },
    isGeoShapeMultiPolygon: { fn: isGeoShapeMultiPolygon, config: {} },
    isIP: { fn: isIP, config: {} },
    isISDN: { fn: isISDN, config: {} },
    isMacAddress: { fn: isMacAddress, config: { preserveColons: { type: 'Boolean' } } },
    isNumber: { fn: isNumber, config: {} },
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
    isISBN: { fn: isISBN, config: {} },
    isISO31661Alpha2: { fn: isISO31661Alpha2, config: {} },
    isISO8601: { fn: isISO8601, config: {} },
    isISSN: { fn: isISSN, config: {} },
    isRFC3339: { fn: isRFC3339, config: {} },
    isJSON: { fn: isJSON, config: {} },
    isLength: { fn: isLength, config: {} },
    isMimeType: { fn: isMimeType, config: {} },
    isPostalCode: { fn: isPostalCode, config: {} },
    isTimestamp: { fn: isTimestamp, config: {} },
    isPublicIp: { fn: isPublicIp, config: {} },
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
// TODO: test pass this
export function isIP(input: any) {
    if (checkIp(input) === 0) return false;
    return true;
}

export function isISDN(input: any) {
    const phoneNumber = new PhoneValidator(`+${input}`);
    return phoneNumber.isValid();
}

export function isMacAddress(input: string) {
    const macAddress = /^([0-9a-fA-F][0-9a-fA-F](:|-|\s)){5}([0-9a-fA-F][0-9a-fA-F])$/;
    const macAddressNoD = /^([0-9a-fA-F]){12}$/;
    const macAddressWithDots = /^([0-9a-fA-F]{4}\.){2}([0-9a-fA-F]{4})$/;

    return macAddress.test(input) || macAddressNoD.test(input) || macAddressWithDots.test(input);
}

export function inRange(input: number, args: { min?: number, max?: number }) {
    const { min, max} = args;

    if (min == null && max == null) {
        throw new Error('Options must contain min or max');
    }

    let range = true;

    if (min && input < min) range = false;
    if (max && input > max) range = false;

    return range;
 }

export function isNumber(input: any, args?: { coerceStrings?: boolean, integer?: boolean, min?: number, max?: number }): input is number {
    let num = input;
    let range = true;
    let int = true;

    if (args && args.coerceStrings) {
        num = ts.toNumber(num);
    }

    if (!ts.isNumber(num)) return false;

    if (args) {
        if (args.min || args.max) {
            range = inRange(num, { min: args.min, max: args.max });
        }

        if (args.integer) {
            int = ts.isInteger(num);
        }
    }

    return range && int;
}

export function isString(input: any) {
    return ts.isString(input);
}

export function isUrl(input: string) {
    return isString(input) && url.isUri(input);
}

export function isUUID(input: any) {
    return isString(input) && validator.isUUID(input);
}

export function contains(input: any, { value }: { value: string }) {
    return isString(input) && input.contains(value);
}
// TODO: should this do more
export function equals(input: any, { value }: { value: string }) {
    return isString(input) && input === value;
}

export function isAlpha(input: any) {
    return isString(input) && validator.isAlpha(input);
}

export function isAlphanumeric(input: any) {
    return isString(input) && validator.isAlphanumeric(input);
}

export function isAscii(input: any) {
    return isString(input) && validator.isAscii(input);
}

export function isBase64(input: any) {
    return isString(input) && validator.isBase64(input);
}

export function isEmpty(input: any) {
    return ts.isEmpty(input);
}

export function isFQDN(input: any, config?: FQDNOptions) {
    return isString(input) && validator.isFQDN(input, config);
}

export function isHash(input: any, { algo }: HashConfig) {
    return isString(input) && validator.isHash(input, algo);
}

export function isISBN(input: any) {
    return isString(input) && validator.isISBN(input);
}

export function isISO31661Alpha2(input: any) {
    return isString(input) && validator.isISO31661Alpha2(input);
}

export function isISO8601(input: any) {
    return isString(input) && validator.isISO8601(input);
}

export function isISSN(input: any, { caseSensitive = false, requireHyphen = false }) {
    const options = { case_sensitive: caseSensitive, require_hyphen: requireHyphen };
    return isString(input) && validator.isISSN(input, options);
}

export function isRFC3339(input: any) {
    return isString(input) && validator.isRFC3339(input);
}

export function isJSON(input: any) {
    return isString(input) && validator.isJSON(input);
}

export function isLength(input: any, { size, min, max }: LengthConfig) {
    if (isString(input)) {
        if (size) return input.length === size;
        if (min || max) return validator.isLength(input, { min, max });
    }
    return false;
}

export function isMimeType(input: any) {
    return isString(input) && validator.isMimeType(input);
}

export function isPostalCode(input: any, { locale = 'any' }: { locale: 'any' | PostalCodeLocale }) {
    return isString(input) && validator.isPostalCode(input, locale);
}

export function validValue(input: any, options?: { invalidValues: any[] }): boolean {
    if (options && options.invalidValues) {
        return input != null && !options.invalidValues.includes(input);
    }

    return input != null;
}

export function isTimestamp(input: any) {
    // string must be a recognized date format, milliseconds or seconds
    if (isNaN(input) || Object.prototype.toString.call(input) === '[object Date]') {
        return !isNaN(Date.parse(input));
    }

    // techinally valid timestamps could have different lenths...need to consider the other implications of this
    // possibly use an option to specificy timestamp ranges
    // if it is a number then it must have 10 digits for seconds or 13 for milliseconds
    return `${input}`.length === 10 || `${input}`.length === 13;
}

export function isPublicIp(input: any, options?: { private: boolean }) {
    let range;
    let result = true;

    try {
        range = ipaddr.parse(input).range();
    } catch (e) {
        return false;
    }

    // ipv6 private is parsed as uniqueLocal
    if (range === 'private' || range === 'uniqueLocal') {
        result = false;
    }

    if (options && options.private) return !result;

    return result;
}
