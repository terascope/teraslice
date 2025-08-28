import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertNodeInfoParams(
    params: ClientParams.NodesInfoParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 7 || majorVersion === 8) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if ([1, 2, 3].includes(majorVersion)) {
            const {
                master_timeout,
                ...parsedParams
            } = params;

            return {
                ...parsedParams,
                ...(master_timeout !== undefined && { cluster_manager_timeout: master_timeout }),
            };
        }
        // future version will have master_timeout gone, renamed to cluster_manager_timeout
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
