import { decrementConfig } from './decrement';
import { toUpperCaseConfig } from './toUpperCase';
import { toLowerCaseConfig } from './toLowerCase';
import { toCamelCaseConfig } from './toCamelCase';
import { toKebabCaseConfig } from './toKebabCase';
import { toPascalCaseConfig } from './toPascalCase';
import { toSnakeCaseConfig } from './toSnakeCase';
import { toTitleCaseConfig } from './toTitleCase';
import { toBooleanConfig } from './toBoolean';
import { toGeoPointConfig } from './toGeoPoint';
import { encodeHexConfig } from './encodeHex';
import { trimConfig } from './trim';
import { trimStartConfig } from './trimStart';
import { trimEndConfig } from './trimEnd';
import { decodeHexConfig } from './decodeHex';

export const fieldTransformsRepository = {
    toUpperCase: toUpperCaseConfig,
    toLowerCase: toLowerCaseConfig,
    toCamelCase: toCamelCaseConfig,
    toKebabCase: toKebabCaseConfig,
    toPascalCase: toPascalCaseConfig,
    toSnakeCase: toSnakeCaseConfig,
    toTitleCase: toTitleCaseConfig,
    toBoolean: toBooleanConfig,
    toGeoPoint: toGeoPointConfig,
    encodeHex: encodeHexConfig,
    trim: trimConfig,
    trimStart: trimStartConfig,
    trimEnd: trimEndConfig,
    decodeHex: decodeHexConfig,
    decrement: decrementConfig
};
