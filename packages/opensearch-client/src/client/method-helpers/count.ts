import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertCountParams(
    params: ClientParams.CountParams,
    distributionMeta: ClientMetadata,
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8 || majorVersion === 7) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if ([1, 2, 3].includes(majorVersion)) {
            return params;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
