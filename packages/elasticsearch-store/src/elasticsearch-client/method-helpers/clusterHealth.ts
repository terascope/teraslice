import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertClusterHealthParams(
    params: ClientParams.ClusterHealthParams,
    distributionMeta: ClientMetadata,
) {
    const { majorVersion, distribution, version } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            return params;
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                master_timeout,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        throw new Error(`Unsupported elasticsearch version: ${version}`);
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
        throw new Error(`Unsupported opensearch version: ${version}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}
