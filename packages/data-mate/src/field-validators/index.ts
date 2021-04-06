import { isBooleanConfig } from './isBoolean';
import { isHashConfig } from './isHash';
import { isStringConfig } from './isString'; 
import { isEmailConfig } from './isEmail';

export const fieldValidationRepository = {
    isBoolean: isBooleanConfig,
    isHash: isHashConfig,
    isString: isStringConfig,
    isEmail: isEmailConfig
} as const;
