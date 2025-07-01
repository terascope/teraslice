import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertClusterSettingsParams(
    params: ClientParams.ClusterGetSettingsParams,
    distributionMeta: ClientMetadata,
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([6, 7, 8].includes(majorVersion)) {
            return params;
        }
    }

    // No major changes between the three as provided below
    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1 || majorVersion === 2 || majorVersion === 3) {
            return params;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
