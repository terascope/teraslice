import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertMSearchParams(
    params: ClientParams.MSearchParams,
    distributionMeta: ClientMetadata,
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

            const returnParams: Record<string, any> = {
                ...parsedParams
            };

            if (body) {
                returnParams.searches = body.map((doc) => {
                    if ('type' in doc) delete doc.type;
                    return doc;
                });
            }

            return returnParams;
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

    throw new Error(`unsupported ${distribution} version ${version}`);
}
