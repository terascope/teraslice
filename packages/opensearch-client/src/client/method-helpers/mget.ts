import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';
import { has } from '@terascope/utils';

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
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }

        if (majorVersion === 2 || majorVersion === 3) {
            if (has(params, 'body.docs[0]._type')) {
                const { body, ...parsedArgs } = params;
                const { docs, ids } = body;

                return {
                    ...parsedArgs,
                    body: {
                        ...(ids !== undefined && { ids }),
                        ...(docs !== undefined && {
                            docs: docs.map((doc) => {
                                const { _type, ...docArgs } = doc;

                                return {
                                    ...docArgs
                                };
                            })
                        })
                    }
                };
            }

            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version ${version}`);
}
