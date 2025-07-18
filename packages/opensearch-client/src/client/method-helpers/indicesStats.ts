import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertIndicesStatsParams(
    params: ClientParams.IndicesStats,
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
                types,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if ([6, 7].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if ([1, 2, 3].includes(majorVersion)) {
            const {
                types,
                ...parsedParams
            } = params;

            return parsedParams;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}
