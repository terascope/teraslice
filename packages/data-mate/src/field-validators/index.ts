import { isBooleanConfig } from './isBoolean';
import { isHashConfig } from './isHash';
import { isStringConfig } from './isString';
import { isEmailConfig } from './isEmail';
import { isEmptyConfig } from './isEmpty';
import { isLengthConfig } from './isLength';
import { isMACAddressConfig } from './isMacAddress';
import { isUrlConfig } from './isUrl';
import { isUUIDConfig } from './isUUID';
import { isBase64Config } from './isBase64';
import { containsConfig } from './contains';
import { equalsConfig } from './equals';
import { isFQDNConfig } from './isFQDN';
import { isCountryCodeConfig } from './isCountryCode';
import { isMimeTypeConfig } from './isMimeType';

export const fieldValidationRepository = {
    isBoolean: isBooleanConfig,
    isHash: isHashConfig,
    isString: isStringConfig,
    isEmail: isEmailConfig,
    isEmpty: isEmptyConfig,
    isLength: isLengthConfig,
    isMacAddress: isMACAddressConfig,
    isUrl: isUrlConfig,
    isUUID: isUUIDConfig,
    isBase64: isBase64Config,
    isFQDN: isFQDNConfig,
    isCountryCode: isCountryCodeConfig,
    isMimeType: isMimeTypeConfig,
    contains: containsConfig,
    equals: equalsConfig
} as const;
