import { containsConfig, ContainsArgs } from './contains';
import { createIDConfig, CreateIDArgs } from './createID';
import { decodeBase64Config } from './decodeBase64';
import { decodeHexConfig } from './decodeHex';
import { decodeURLConfig } from './decodeURL';
import { encodeConfig, EncodeArgs } from './encode';
import { encodeBase64Config } from './encodeBase64';
import { encodeHexConfig } from './encodeHex';
import { encodeSHAConfig, EncodeSHAArgs } from './encodeSHA';
import { encodeSHA1Config, EncodeSHA1Args } from './encodeSHA1';
import { encodeURLConfig } from './encodeURL';
import { endsWithConfig, EndsWithArgs } from './endsWith';
import { entropyConfig, EntropyArgs } from './entropy';
import { extractConfig, ExtractArgs } from './extract';
import { isAlphaConfig, IsAlphaArgs } from './isAlpha';
import { isAlphaNumericConfig, IsAlphaNumericArgs } from './isAlphaNumeric';
import { isBase64Config } from './isBase64';
import { isCountryCodeConfig } from './isCountryCode';
import { isEmailConfig } from './isEmail';
import { isFQDNConfig } from './isFQDN';
import { isHashConfig, IsHashArgs } from './isHash';
import { isISDNConfig, IsISDNArgs } from './isISDN';
import { isLengthConfig, IsLengthArgs } from './isLength';
import { isMACAddressConfig, IsMACArgs } from './isMACAddress';
import { isMIMETypeConfig } from './isMIMEType';
import { isPhoneNumberLikeConfig } from './isPhoneNumberLike';
import { isPortConfig } from './isPort';
import { isPostalCodeConfig, IsPostalCodeArgs } from './isPostalCode';
import { isStringConfig } from './isString';
import { isURLConfig } from './isURL';
import { isUUIDConfig } from './isUUID';
import { joinConfig, JoinArgs } from './join';
import { replaceLiteralConfig, ReplaceLiteralArgs } from './replaceLiteral';
import { replaceRegexConfig, ReplaceRegexArgs } from './replaceRegex';
import { reverseConfig } from './reverse';
import { splitConfig, SplitArgs } from './split';
import { startsWithConfig, StartsWithArgs } from './startsWith';
import { toCamelCaseConfig } from './toCamelCase';
import { toISDNConfig } from './toISDN';
import { toKebabCaseConfig } from './toKebabCase';
import { toLowerCaseConfig } from './toLowerCase';
import { toPascalCaseConfig } from './toPascalCase';
import { toSnakeCaseConfig } from './toSnakeCase';
import { toStringConfig } from './toString';
import { toTitleCaseConfig } from './toTitleCase';
import { toUpperCaseConfig } from './toUpperCase';
import { trimConfig, TrimArgs } from './trim';
import { trimEndConfig, TrimEndArgs } from './trimEnd';
import { trimStartConfig, TrimStartArgs } from './trimStart';
import { truncateConfig, TruncateConfig } from './truncate';

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
