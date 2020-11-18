import { isBooleanConfig } from './isBoolean';
import { isBooleanLikeConfig } from './isBooleanLike';
import { isEmailConfig } from './isEmail';
import { isURLConfig } from './isURL';

export const ColumnValidator = Object.freeze({
    isBoolean: isBooleanConfig,
    isBooleanLike: isBooleanLikeConfig,
    isEmail: isEmailConfig,
    isURL: isURLConfig,
});
