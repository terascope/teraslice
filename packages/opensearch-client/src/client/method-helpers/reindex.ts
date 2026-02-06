import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertReIndexParams(
    params: ClientParams.ReindexParams,
    distributionMeta: ClientMetadata
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

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
