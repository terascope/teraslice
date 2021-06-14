import { extractMappedIPv4Config } from './extractMappedIPv4';
import { getCIDRBroadcastConfig } from './getCIDRBroadcast';
import { getCIDRMaxConfig } from './getCIDRMax';
import { getCIDRMinConfig } from './getCIDRMin';
import { getCIDRNetworkConfig } from './getCIDRNetwork';
import { inIPRangeConfig, InIPRangeArgs } from './inIPRange';
import { intToIPConfig, IntToIPArgs } from './intToIP';
import { ipToIntConfig } from './ipToInt';
import { isCIDRConfig } from './isCIDR';
import { isIPConfig } from './isIP';
import { isIPv4Config } from './isIPv4';
import { isIPv6Config } from './isIPv6';
import { isMappedIPv4Config } from './isMappedIPv4';
import { isNonRoutableIPConfig } from './isNonRoutableIP';
import { isRoutableIPConfig } from './isRoutableIP';
import { reverseIPConfig } from './reverseIP';
import { toCIDRConfig, ToCIDRArgs } from './toCIDR';

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
