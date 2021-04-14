import { toUpperCaseConfig } from './toUpperCase';
import { toBooleanConfig } from './toBoolean';
import { toGeoPointConfig } from './toGeoPoint';
import { encodeHexConfig } from './encodeHex';
import { trimConfig } from './trim';
import { trimStartConfig } from './trimStart';

export const fieldTransformsRepository = {
    toUpperCase: toUpperCaseConfig,
    toBoolean: toBooleanConfig,
    toGeoPoint: toGeoPointConfig,
    encodeHex: encodeHexConfig,
    trim: trimConfig,
    trimStart: trimStartConfig
};
