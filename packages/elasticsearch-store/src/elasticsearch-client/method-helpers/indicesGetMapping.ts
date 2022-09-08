import { ElasticsearchDistribution, ClientParams } from '@terascope/types';
import type { DistributionMetadata } from '../interfaces';

export function convertIndicesGetMappingParams(
    params: ClientParams.IndicesGetMappingParams,
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                include_type_name, type,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 7) {
            const {
                include_type_name, type,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 6) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                master_timeout, type, include_type_name,
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
