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

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                body,
                ...parsedParams
            } = params;

            return {
                source: body?.source,
                dest: body?.dest,
                ...parsedParams
            };
        }

        if (majorVersion === 7) {
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
