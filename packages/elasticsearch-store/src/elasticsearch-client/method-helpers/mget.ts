import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertMGetParams(
    params: ClientParams.MGetParams,
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
                type,
                body,
                ...parsedParams
            } = params;

            const returnParams: Record<string, any> = {
                ...parsedParams
            };

            if (body?.docs) {
                returnParams.docs = body.docs.map((doc) => {
                    delete doc._type;
                    return doc;
                });
            }

            if (body?.ids) {
                returnParams.ids = params.body.ids;
            }

            return returnParams;
        }

        if (majorVersion === 7) {
            const {
                type,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 6) {
            const {
                type = '_doc',
                ...parsedParams
            } = params;

            return {
                type,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                type,
                ...parsedParams
            } = params;

            return parsedParams;
        }
    }

    throw new Error(`unsupported ${distribution} version ${version}`);
}
