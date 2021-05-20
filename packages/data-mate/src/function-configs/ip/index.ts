import { isIPConfig } from './isIP';
import { inIPRangeConfig } from './inIPRange';
import { isCIDRConfig } from './isCIDR';
import { isIPV4Config } from './isIPV4';
import { isIPV6Config } from './isIPV6';
import { isNonRoutableIPConfig } from './isNonRoutableIP';
import { isRoutableIPConfig } from './isRoutableIP';
import { reverseIPConfig } from './reverseIP';
import { isMappedIPV4Config } from './isMappedIPV4';
import { extractMappedIPV4Config } from './extractMappedIPV4';
import { ipToIntConfig } from './ipToInt';
import { intToIPConfig } from './intToIP';
import { getCIDRMinConfig } from './getCIDRMin';
import { getCIDRMaxConfig } from './getCIDRMax';
import { getCIDRBroadcastConfig } from './getCIDRBroadcast';
import { getCIDRNetworkConfig } from './getCIDRNetwork';
import { toCIDRConfig } from './toCIDR';

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
