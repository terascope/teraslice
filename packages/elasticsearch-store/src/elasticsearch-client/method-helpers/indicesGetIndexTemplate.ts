import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertIndicesGetIndexTemplateParams(
    params: ClientParams.IndicesGetIndexTemplateParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                include_type_name,
                ...parsedParams
            } = params;

            return {
                ...parsedParams
            };
        }

        if (majorVersion === 7) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }

        if (majorVersion === 2 || majorVersion === 3) {
            const {
                master_timeout,
                include_type_name,
                ...parsedParams
            } = params;

            return {
                ...parsedParams,
                ...(master_timeout !== undefined && { cluster_manager_timeout: master_timeout }),
            };
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}
