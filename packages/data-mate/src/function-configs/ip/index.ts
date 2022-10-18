import { extractMappedIPv4Config } from './extractMappedIPv4.js';
import { getCIDRBroadcastConfig } from './getCIDRBroadcast.js';
import { getCIDRMaxConfig } from './getCIDRMax.js';
import { getCIDRMinConfig } from './getCIDRMin.js';
import { getCIDRNetworkConfig } from './getCIDRNetwork.js';
import { inIPRangeConfig, InIPRangeArgs } from './inIPRange.js';
import { intToIPConfig, IntToIPArgs } from './intToIP.js';
import { ipToIntConfig } from './ipToInt.js';
import { isCIDRConfig } from './isCIDR.js';
import { isIPConfig } from './isIP.js';
import { isIPv4Config } from './isIPv4.js';
import { isIPv6Config } from './isIPv6.js';
import { isMappedIPv4Config } from './isMappedIPv4.js';
import { isNonRoutableIPConfig } from './isNonRoutableIP.js';
import { isRoutableIPConfig } from './isRoutableIP.js';
import { reverseIPConfig } from './reverseIP.js';
import { toCIDRConfig, ToCIDRArgs } from './toCIDR.js';

export const ipRepository = {
    isIP: isIPConfig,
    inIPRange: inIPRangeConfig,
    isCIDR: isCIDRConfig,
    isIPv4: isIPv4Config,
    isIPv6: isIPv6Config,
    isNonRoutableIP: isNonRoutableIPConfig,
    isRoutableIP: isRoutableIPConfig,
    isMappedIPv4: isMappedIPv4Config,
    extractMappedIPv4: extractMappedIPv4Config,
    reverseIP: reverseIPConfig,
    ipToInt: ipToIntConfig,
    intToIP: intToIPConfig,
    getCIDRMin: getCIDRMinConfig,
    getCIDRMax: getCIDRMaxConfig,
    getCIDRBroadcast: getCIDRBroadcastConfig,
    getCIDRNetwork: getCIDRNetworkConfig,
    toCIDR: toCIDRConfig
};

export type {
    InIPRangeArgs,
    IntToIPArgs,
    ToCIDRArgs
};
