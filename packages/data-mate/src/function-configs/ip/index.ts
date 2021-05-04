import { isIPConfig } from './isIP';
import { inIPRangeConfig } from './inIPRange';
import { isCIDRConfig } from './isCIDR';
import { isIPV4Config } from './isIPV4';
import { isIPV6Config } from './isIPV6';
import { isNonRoutableIPConfig } from './isNonRoutableIP';
import { isRoutableIPConfig } from './isRoutableIP';

export const ipRepository = {
    isIP: isIPConfig,
    inIPRange: inIPRangeConfig,
    isCIDR: isCIDRConfig,
    isIPV4: isIPV4Config,
    isIPV6: isIPV6Config,
    isNonRoutableIP: isNonRoutableIPConfig,
    isRoutableIP: isRoutableIPConfig
};
