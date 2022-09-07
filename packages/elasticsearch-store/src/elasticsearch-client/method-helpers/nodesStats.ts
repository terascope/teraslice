import { ElasticsearchDistribution, ClientParams } from '@terascope/types';
import type { DistributionMetadata } from '../interfaces';

export function convertNodesStatsParams(
    params: ClientParams.NodesStatsParams,
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            return params;
        }

        if (majorVersion === 7) {
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
        if (majorVersion === 1) {
            const {
                master_timeout,
                ...parsedParams
            } = params;

            if (master_timeout) {
                // @ts-expect-error, master_timeout is deprecated
                parsedParams.cluster_manager_timeout = master_timeout;
            }

            return parsedParams;
        }
        // future version will have master_timeout gone, renamed to cluster_manager_timeout
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
