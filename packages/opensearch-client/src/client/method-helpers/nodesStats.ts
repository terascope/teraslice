import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertNodesStatsParams(
    params: ClientParams.NodesStatsParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

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
