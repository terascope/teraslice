import { ElasticsearchDistribution, ClientParams } from '@terascope/types';
import type { DistributionMetadata } from '../interfaces';

export function convertReIndexParams(
    params: ClientParams.ReindexParams,
    distributionMeta: DistributionMetadata
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
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
