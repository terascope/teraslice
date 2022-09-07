import { ElasticsearchDistribution, ClientParams } from '@terascope/types';
import type { DistributionMetadata } from '../interfaces';

export function convertIndicesExistsParams(
    params: ClientParams.IndicesExistsParams,
    distributionMeta: DistributionMetadata,
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([6, 7, 8].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}
