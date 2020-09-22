import { isBooleanConfig } from './isBoolean';
import { isURLConfig } from './isURL';

export const ColumnValidator = Object.freeze({
    isBoolean: isBooleanConfig,
    isURL: isURLConfig,
});
