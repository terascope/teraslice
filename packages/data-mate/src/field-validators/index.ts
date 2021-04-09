import { isBooleanConfig } from './isBoolean';
import { isHashConfig } from './isHash';
import { isStringConfig } from './isString';
import { isEmailConfig } from './isEmail';
import { isEmptyConfig } from './isEmpty';
import { isLengthConfig } from './isLength';
import { isMACAddressConfig } from './isMacAddress';
import { isURLConfig } from './isURL';

export const fieldValidationRepository = {
    isBoolean: isBooleanConfig,
    isHash: isHashConfig,
    isString: isStringConfig,
    isEmail: isEmailConfig,
    isEmpty: isEmptyConfig,
    isLength: isLengthConfig,
    isMacAddress: isMACAddressConfig,
    isURL: isURLConfig

} as const;
