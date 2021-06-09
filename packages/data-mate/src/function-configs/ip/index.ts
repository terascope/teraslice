import { extractMappedIPV4Config } from './extractMappedIPV4';
import { getCIDRBroadcastConfig } from './getCIDRBroadcast';
import { getCIDRMaxConfig } from './getCIDRMax';
import { getCIDRMinConfig } from './getCIDRMin';
import { getCIDRNetworkConfig } from './getCIDRNetwork';
import { inIPRangeConfig, InIPRangeArgs } from './inIPRange';
import { intToIPConfig, IntToIPArgs } from './intToIP';
import { ipToIntConfig } from './ipToInt';
import { isCIDRConfig } from './isCIDR';
import { isIPConfig } from './isIP';
import { isIPV4Config } from './isIPV4';
import { isIPV6Config } from './isIPV6';
import { isMappedIPV4Config } from './isMappedIPV4';
import { isNonRoutableIPConfig } from './isNonRoutableIP';
import { isRoutableIPConfig } from './isRoutableIP';
import { reverseIPConfig } from './reverseIP';
import { toCIDRConfig, ToCIDRArgs } from './toCIDR';

export const ipRepository = {
    isIP: isIPConfig,
    inIPRange: inIPRangeConfig,
    isCIDR: isCIDRConfig,
    isIPV4: isIPV4Config,
    isIPV6: isIPV6Config,
    isNonRoutableIP: isNonRoutableIPConfig,
    isRoutableIP: isRoutableIPConfig,
    isMappedIPV4: isMappedIPV4Config,
    extractMappedIPV4: extractMappedIPV4Config,
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
