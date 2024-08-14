import { containsConfig, ContainsArgs } from './contains.js';
import { createIDConfig, CreateIDArgs } from './createID.js';
import { decodeBase64Config } from './decodeBase64.js';
import { decodeHexConfig } from './decodeHex.js';
import { decodeURLConfig } from './decodeURL.js';
import { encodeConfig, EncodeArgs } from './encode.js';
import { encodeBase64Config } from './encodeBase64.js';
import { encodeHexConfig } from './encodeHex.js';
import { encodeSHAConfig, EncodeSHAArgs } from './encodeSHA.js';
import { encodeSHA1Config, EncodeSHA1Args } from './encodeSHA1.js';
import { encodeURLConfig } from './encodeURL.js';
import { endsWithConfig, EndsWithArgs } from './endsWith.js';
import { entropyConfig, EntropyArgs } from './entropy.js';
import { extractConfig, ExtractArgs } from './extract.js';
import { isAlphaConfig, IsAlphaArgs } from './isAlpha.js';
import { isAlphaNumericConfig, IsAlphaNumericArgs } from './isAlphaNumeric.js';
import { isBase64Config } from './isBase64.js';
import { isCountryCodeConfig } from './isCountryCode.js';
import { isEmailConfig } from './isEmail.js';
import { isFQDNConfig } from './isFQDN.js';
import { isHashConfig, IsHashArgs } from './isHash.js';
import { isISDNConfig, IsISDNArgs } from './isISDN.js';
import { isLengthConfig, IsLengthArgs } from './isLength.js';
import { isMACAddressConfig, IsMACArgs } from './isMACAddress.js';
import { isMIMETypeConfig } from './isMIMEType.js';
import { isPhoneNumberLikeConfig } from './isPhoneNumberLike.js';
import { isPortConfig } from './isPort.js';
import { isPostalCodeConfig, IsPostalCodeArgs } from './isPostalCode.js';
import { isStringConfig } from './isString.js';
import { isURLConfig } from './isURL.js';
import { isUUIDConfig } from './isUUID.js';
import { joinConfig, JoinArgs } from './join.js';
import { replaceLiteralConfig, ReplaceLiteralArgs } from './replaceLiteral.js';
import { replaceRegexConfig, ReplaceRegexArgs } from './replaceRegex.js';
import { reverseConfig } from './reverse.js';
import { splitConfig, SplitArgs } from './split.js';
import { startsWithConfig, StartsWithArgs } from './startsWith.js';
import { toCamelCaseConfig } from './toCamelCase.js';
import { toISDNConfig } from './toISDN.js';
import { toKebabCaseConfig } from './toKebabCase.js';
import { toLowerCaseConfig } from './toLowerCase.js';
import { toPascalCaseConfig } from './toPascalCase.js';
import { toSnakeCaseConfig } from './toSnakeCase.js';
import { toStringConfig } from './toString.js';
import { toTitleCaseConfig } from './toTitleCase.js';
import { toUpperCaseConfig } from './toUpperCase.js';
import { trimConfig, TrimArgs } from './trim.js';
import { trimEndConfig, TrimEndArgs } from './trimEnd.js';
import { trimStartConfig, TrimStartArgs } from './trimStart.js';
import { truncateConfig, TruncateConfig } from './truncate.js';

export const stringRepository = {
    contains: containsConfig,
    createID: createIDConfig,
    decodeBase64: decodeBase64Config,
    decodeHex: decodeHexConfig,
    decodeURL: decodeURLConfig,
    encode: encodeConfig,
    encodeBase64: encodeBase64Config,
    encodeHex: encodeHexConfig,
    encodeSHA: encodeSHAConfig,
    encodeSHA1: encodeSHA1Config,
    encodeURL: encodeURLConfig,
    endsWith: endsWithConfig,
    entropy: entropyConfig,
    extract: extractConfig,
    isAlpha: isAlphaConfig,
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
    join: joinConfig,
    replaceLiteral: replaceLiteralConfig,
    replaceRegex: replaceRegexConfig,
    reverse: reverseConfig,
    split: splitConfig,
    startsWith: startsWithConfig,
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

export type {
    ContainsArgs,
    CreateIDArgs,
    EncodeArgs,
    EncodeSHAArgs,
    EncodeSHA1Args,
    EndsWithArgs,
    EntropyArgs,
    ExtractArgs,
    IsAlphaArgs,
    IsAlphaNumericArgs,
    IsHashArgs,
    IsISDNArgs,
    IsLengthArgs,
    IsMACArgs,
    IsPostalCodeArgs,
    JoinArgs,
    ReplaceLiteralArgs,
    ReplaceRegexArgs,
    SplitArgs,
    StartsWithArgs,
    TrimArgs,
    TrimEndArgs,
    TrimStartArgs,
    TruncateConfig
};
