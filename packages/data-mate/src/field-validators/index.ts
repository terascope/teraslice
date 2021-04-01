import { isBooleanConfig } from './isBoolean';
import { isHashConfig } from './isHash';
import { isEmptyConfig } from './isEmpty';
import { isLengthConfig } from './isLength';

export const fieldValidationRepository = {
    isBoolean: isBooleanConfig,
    isHash: isHashConfig,
    isEmpty: isEmptyConfig,
    isLength: isLengthConfig
} as const;
