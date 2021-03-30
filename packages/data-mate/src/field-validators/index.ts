import { isBooleanConfig } from './isBoolean';
import { isHashConfig } from './isHash';

export const fieldValidationRepository = {
    isBoolean: isBooleanConfig,
    isHash: isHashConfig
} as const;
