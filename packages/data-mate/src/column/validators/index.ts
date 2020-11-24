import { isAlphaConfig } from './isAlpha';
import { isAlphanumericConfig } from './isAlphanumeric';
import { isBooleanConfig } from './isBoolean';
import { isBooleanLikeConfig } from './isBooleanLike';
import { isEmailConfig } from './isEmail';
import { isEqualConfig } from './isEqual';
import { isURLConfig } from './isURL';
import { isUUIDConfig } from './isUUID';

export const ColumnValidator = Object.freeze({
    isAlpha: isAlphaConfig,
    isAlphanumeric: isAlphanumericConfig,
    isBoolean: isBooleanConfig,
    isBooleanLike: isBooleanLikeConfig,
    isEmail: isEmailConfig,
    isEqual: isEqualConfig,
    isURL: isURLConfig,
    isUUID: isUUIDConfig,
});
