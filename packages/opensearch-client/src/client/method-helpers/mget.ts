import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';
import { has } from '@terascope/core-utils';

export function convertMGetParams(
    params: ClientParams.MGetParams,
    distributionMeta: ClientMetadata
): ClientParams.MGetParams {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

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
