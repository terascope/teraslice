import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertIndicesStatsParams(
    params: ClientParams.IndicesStatsParams,
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

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                expand_wildcards,
                ...parsedParams
            } = params;

            return parsedParams;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) return params;
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}
