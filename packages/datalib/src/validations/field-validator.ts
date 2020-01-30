import * as ts from '@terascope/utils';
import { isIP as checkIp } from 'net';
import PhoneValidator from 'awesome-phonenumber';
import validator from 'validator';
import * as url from 'valid-url';
import { toLowerCase } from '../transforms/field-transform';
import {
    FQDNOptions,
    HashConfig,
    LengthConfig,
    PostalCodeLocale
} from './interfaces';
import * as i from '../interfaces';

const geoJSONTypes = Object.keys(i.GeoShapeType).map(toLowerCase);

export const respoitory: i.Repository = {
    isBoolean: { fn: isBoolean, config: {} },
    isBooleanLike: { fn: isBooleanLike, config: {} },
    isEmail: { fn: isEmail, config: {} },
    isGeoJSON: { fn: isGeoJSON, config: {} },
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
};

export function isBoolean(input: any): input is boolean {
    return ts.isBoolean(input);
}

export function isBooleanLike(input: any) {
    return ts.isBooleanLike(input);
}

export function isEmail(input: string): boolean {
    // Email Validation as per RFC2822 standards. Straight from .net helpfiles
    // eslint-disable-next-line
    const regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    if (ts.isString(input) && input.toLowerCase().match(regex)) return true;

    return false;
}

export function isGeoJSON(input: any) {
    return ts.isPlainObject(input)
        && Array.isArray(input.coordinates)
        && geoJSONTypes.includes(toLowerCase(input.type));
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
    if (checkIp(input) === 0) return false;
    return true;
}

export function isISDN(input: any) {
    const phoneNumber = new PhoneValidator(`+${input}`);
    return phoneNumber.isValid();
}

export function isMacAddress(input: any, { preserveColons = false }) {
    const options = { no_colons: !preserveColons };
    return isString(input) && validator.isMACAddress(input, options);
}

export function isNumber(input: any): input is number {
    return ts.isNumber(input);
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
