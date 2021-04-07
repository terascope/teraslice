import { isBooleanConfig } from './isBoolean';
import { isHashConfig } from './isHash';
import { isStringConfig } from './isString'; 
import { isEmailConfig } from './isEmail';
import { isEmptyConfig } from './isEmpty';
import { isLengthConfig } from './isLength';
import { isMACAddress } from './isMacAddress';

export const fieldValidationRepository = {
    isBoolean: isBooleanConfig,
    isHash: isHashConfig,
    isString: isStringConfig,
    isEmail: isEmailConfig,
    isEmpty: isEmptyConfig,
    isLength: isLengthConfig,
    isMacAddress: isMACAddress
} as const;
