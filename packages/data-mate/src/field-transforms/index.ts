import { decodeBase64Config } from './decodeBase64';
import { decodeHexConfig } from './decodeHex';
import { decodeURLConfig } from './decodeURL';
import { decrementConfig } from './decrement';
import { divideConfig } from './divide';
import { encodeBase64Config } from './encodeBase64';
import { encodeHexConfig } from './encodeHex';
import { encodeSHAConfig } from './encodeSHA';
import { encodeSHA1Config } from './encodeSHA1';
import { encodeURLConfig } from './encodeURL';
import { extractConfig } from './extract';
import { incrementConfig } from './increment';
import { parseJSONConfig } from './parseJSON';
import { reverseConfig } from './reverse';
import { toBooleanConfig } from './toBoolean';
import { toCamelCaseConfig } from './toCamelCase';
import { toGeoPointConfig } from './toGeoPoint';
import { toISDNConfig } from './toISDN';
import { toJSONConfig } from './toJSON';
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

export const fieldTransformsRepository = {
    decodeBase64: decodeBase64Config,
    decodeHex: decodeHexConfig,
    decodeURL: decodeURLConfig,
    decrement: decrementConfig,
    divide: divideConfig,
    encodeBase64: encodeBase64Config,
    encodeHex: encodeHexConfig,
    encodeSHA: encodeSHAConfig,
    encodeSHA1: encodeSHA1Config,
    encodeURL: encodeURLConfig,
    extract: extractConfig,
    increment: incrementConfig,
    parseJSON: parseJSONConfig,
    reverse: reverseConfig,
    toBoolean: toBooleanConfig,
    toCamelCase: toCamelCaseConfig,
    toGeoPoint: toGeoPointConfig,
    toISDN: toISDNConfig,
    toJSON: toJSONConfig,
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
