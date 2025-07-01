import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertTasksCancelParams(
    params: ClientParams.TasksCancelParams,
    distributionMeta: ClientMetadata,
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([6, 7, 8].includes(majorVersion)) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1 || majorVersion === 2 || majorVersion === 3) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}
