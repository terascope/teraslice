import { isBooleanConfig } from './isBoolean.js';
import { isBooleanLikeConfig } from './isBooleanLike.js';
import { toBooleanConfig } from './toBoolean.js';

export const booleanRepository = {
    isBoolean: isBooleanConfig,
    isBooleanLike: isBooleanLikeConfig,
    toBoolean: toBooleanConfig,
};
