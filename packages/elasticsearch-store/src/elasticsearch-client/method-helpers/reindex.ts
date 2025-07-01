import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';
import { has } from '@terascope/utils';

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

            delete body?.dest?.type;

            return {
                source: body?.source,
                dest: body?.dest,
                ...parsedParams
            };
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                scroll,
                max_docs,
                ...parsedParams
            } = params;

            if (parsedParams.body.dest.type == null) parsedParams.body.dest.type = '_doc';

            return parsedParams;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1 || majorVersion === 2 || majorVersion === 3) {
            if (has(params, 'body.dest.type')) {
                delete params.body.dest.type;
            }
            return params;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
