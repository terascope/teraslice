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

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 7 || majorVersion === 8) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                include_unloaded_segments,
                master_timeout,
                ...parsedParams
            } = params;

            return parsedParams;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1 || majorVersion === 2 || majorVersion === 3) {
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
