import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertIndicesPutMappingParams(
    params: ClientParams.IndicesPutMappingParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        const {
            include_type_name = true,
            type = '_doc',
            ...parsedParams
        } = params;

        if (majorVersion === 8 || majorVersion === 7) {
            return parsedParams;
        }

        if (majorVersion === 6) {
            return {
                type,
                include_type_name,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1 || majorVersion === 2) {
            const {
                include_type_name,
                type,
                master_timeout,
                ...parsedParams
            } = params;

            if (master_timeout) {
                // @ts-expect-error
                parsedParams.cluster_manager_timeout = master_timeout;
            }

            return parsedParams;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
