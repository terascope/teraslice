import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertIndicesGetSettingsParams(
    params: ClientParams.IndicesGetSettingsParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([7, 8].includes(majorVersion)) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if ([1, 2, 3].includes(majorVersion)) {
            const {
                master_timeout, ...parsedParams
            } = params;

            return {
                ...parsedParams,
                ...(master_timeout !== undefined && { cluster_manager_timeout: master_timeout }),
            };
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
