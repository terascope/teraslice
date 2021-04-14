import { toUpperCaseConfig } from './toUpperCase';
import { toBooleanConfig } from './toBoolean';
import { toGeoPointConfig } from './toGeoPoint';
import { encodeHexConfig } from './encodeHex';
import { trimConfig } from './trim';
import { trimStartConfig } from './trimStart';
import { trimEndConfig } from './trimEnd';
import { decodeHexConfig } from './decodeHex';

export const fieldTransformsRepository = {
    toUpperCase: toUpperCaseConfig,
    toBoolean: toBooleanConfig,
    toGeoPoint: toGeoPointConfig,
    encodeHex: encodeHexConfig,
    trim: trimConfig,
    trimStart: trimStartConfig,
    trimEnd: trimEndConfig,
    decodeHex: decodeHexConfig
};
