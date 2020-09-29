import { isBooleanConfig } from './isBoolean';
import { isBooleanLikeConfig } from './isBooleanLike';
import { isURLConfig } from './isURL';

export const ColumnValidator = Object.freeze({
    isBoolean: isBooleanConfig,
    isBooleanLike: isBooleanLikeConfig,
    isURL: isURLConfig,
});
