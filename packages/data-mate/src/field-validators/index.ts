import { isBooleanConfig } from './isBoolean';
import { isHashConfig } from './isHash';
import { isStringConfig } from './isString'; 

export const fieldValidationRepository = {
    isBoolean: isBooleanConfig,
    isHash: isHashConfig,
    isString: isStringConfig
} as const;
