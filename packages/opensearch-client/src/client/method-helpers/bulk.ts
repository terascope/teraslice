import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertBulkParams(
    params: ClientParams.BulkParams,
    distributionMeta: ClientMetadata,
) {
    const { majorVersion, distribution, version } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                body,
                ...parsedParams
            } = params;

            return {
                operations: body,
                ...parsedParams
            };
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
            return params;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
