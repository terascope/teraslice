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

    if (distribution === ElasticsearchDistribution.opensearch) {
        if ([1, 2, 3].includes(majorVersion)) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}
