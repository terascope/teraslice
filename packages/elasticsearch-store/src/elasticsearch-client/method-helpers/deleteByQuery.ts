import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertDeleteByQueryParams(
    params: ClientParams.DeleteByQueryParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    // though documentation says body property is optional
    // es base client requires body property to be present even if empty
    const {
        type = '_doc',
        body = {},
        ...parsedParams
    } = params;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8 || majorVersion === 7) {
            return {
                body,
                ...parsedParams
            };
        }

        if (majorVersion === 6) {
            return {
                type,
                body,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1 || majorVersion === 2 || majorVersion === 3) {
            return {
                body,
                ...parsedParams
            };
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
