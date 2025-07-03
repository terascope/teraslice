import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertDeleteParams(
    params: ClientParams.DeleteParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    const {
        type = '_doc',
        ...parsedParams
    } = params;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8 || majorVersion === 7) {
            return parsedParams;
        }

        if (majorVersion === 6) {
            return {
                type,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if ([1, 2, 3].includes(majorVersion)) {
            return parsedParams;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
