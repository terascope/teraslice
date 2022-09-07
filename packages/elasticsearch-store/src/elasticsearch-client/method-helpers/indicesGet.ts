import { ElasticsearchDistribution, ClientParams } from '@terascope/types';
import type { DistributionMetadata } from '../interfaces';

export function convertIndicesGetParams(
    params: ClientParams.IndicesGetParams,
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
                include_type_name,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if ([6, 7].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) return params;
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}
