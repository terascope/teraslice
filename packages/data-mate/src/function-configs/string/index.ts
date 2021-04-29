import { containsConfig } from './contains';
import { decodeBase64Config } from './decodeBase64';
import { decodeHexConfig } from './decodeHex';
import { decodeURLConfig } from './decodeURL';
import { encodeBase64Config } from './encodeBase64';
import { encodeHexConfig } from './encodeHex';
import { encodeSHAConfig } from './encodeSHA';
import { encodeSHA1Config } from './encodeSHA1';
import { encodeURLConfig } from './encodeURL';
import { extractConfig } from './extract';
import { isAlphaNumericConfig } from './isAlphaNumeric';
import { isBase64Config } from './isBase64';
import { isCountryCodeConfig } from './isCountryCode';
import { isEmailConfig } from './isEmail';
import { isFQDNConfig } from './isFQDN';
import { isHashConfig } from './isHash';
import { isISDNConfig } from './isISDN';
import { isLengthConfig } from './isLength';
import { isMACAddressConfig } from './isMACAddress';
import { isMIMETypeConfig } from './isMIMEType';
import { isPhoneNumberLikeConfig } from './isPhoneNumberLike';
import { isPortConfig } from './isPort';
import { isPostalCodeConfig } from './isPostalCode';
import { isStringConfig } from './isString';
import { isURLConfig } from './isURL';
import { isUUIDConfig } from './isUUID';
import { reverseConfig } from './reverse';
import { toCamelCaseConfig } from './toCamelCase';
import { toISDNConfig } from './toISDN';
import { toKebabCaseConfig } from './toKebabCase';
import { toLowerCaseConfig } from './toLowerCase';
import { toPascalCaseConfig } from './toPascalCase';
import { toSnakeCaseConfig } from './toSnakeCase';
import { toStringConfig } from './toString';
import { toTitleCaseConfig } from './toTitleCase';
import { toUpperCaseConfig } from './toUpperCase';
import { trimConfig } from './trim';
import { trimEndConfig } from './trimEnd';
import { trimStartConfig } from './trimStart';
import { truncateConfig } from './truncate';

export const stringRepository = {
    contains: containsConfig,
    decodeBase64: decodeBase64Config,
    decodeHex: decodeHexConfig,
    decodeURL: decodeURLConfig,
    encodeBase64: encodeBase64Config,
    encodeHex: encodeHexConfig,
    encodeSHA: encodeSHAConfig,
    encodeSHA1: encodeSHA1Config,
    encodeURL: encodeURLConfig,
    extract: extractConfig,
    isAlphaNumeric: isAlphaNumericConfig,
    isBase64: isBase64Config,
    isCountryCode: isCountryCodeConfig,
    isEmail: isEmailConfig,
    isFQDN: isFQDNConfig,
    isHash: isHashConfig,
    isISDN: isISDNConfig,
    isLength: isLengthConfig,
    isMACAddress: isMACAddressConfig,
    isMIMEType: isMIMETypeConfig,
    isPhoneNumberLike: isPhoneNumberLikeConfig,
    isPort: isPortConfig,
    isPostalCode: isPostalCodeConfig,
    isString: isStringConfig,
    isURL: isURLConfig,
    isUUID: isUUIDConfig,
    reverse: reverseConfig,
    toCamelCase: toCamelCaseConfig,
    toISDN: toISDNConfig,
    toKebabCase: toKebabCaseConfig,
    toLowerCase: toLowerCaseConfig,
    toPascalCase: toPascalCaseConfig,
    toSnakeCase: toSnakeCaseConfig,
    toString: toStringConfig,
    toTitleCase: toTitleCaseConfig,
    toUpperCase: toUpperCaseConfig,
    trim: trimConfig,
    trimEnd: trimEndConfig,
    trimStart: trimStartConfig,
    truncate: truncateConfig,
};
