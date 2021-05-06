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
import { IPToIntConfig } from './IPToInt';
import { intToIPConfig } from './intToIP';
import { CIDRMinConfig } from './CIDRMin';
import { CIDRMaxConfig } from './CIDRMax';
import { CIDRBroadcastConfig } from './CIDRBroadcast';
import { CIDRNetworkConfig } from './CIDRNetwork';
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
    IPToInt: IPToIntConfig,
    intToIP: intToIPConfig,
    CIDRMin: CIDRMinConfig,
    CIDRMax: CIDRMaxConfig,
    CIDRBroadcast: CIDRBroadcastConfig,
    CIDRNetwork: CIDRNetworkConfig,
    toCIDR: toCIDRConfig
};
