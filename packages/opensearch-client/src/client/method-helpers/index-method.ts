import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertIndexParams(
    params: ClientParams.IndexParams,
    distributionMeta: ClientMetadata,
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            // make sure to remove type
            const {
                body, ...parsedParams
            } = params;
            // ES8 does not have body
            return {
                document: body,
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
