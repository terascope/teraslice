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
                type,
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
            const {
                type,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 6) {
            const {
                type = '_doc',
                ccs_minimize_roundtrips,
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

        if (majorVersion === 2 || majorVersion === 3) {
            const {
                type,
                body,
                ...parsedParams
            } = params;

            return {
                ...parsedParams,
                body: body.map((doc) => {
                    // @ts-expect-error type only exists on one type, not the other
                    // hence th error
                    const { type: _type, ...docArgs } = doc;

                    return {
                        ...docArgs
                    };
                })

            };
        }
    }

    throw new Error(`unsupported ${distribution} version ${version}`);
}
