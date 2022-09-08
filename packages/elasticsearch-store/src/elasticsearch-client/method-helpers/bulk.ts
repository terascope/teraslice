import { ElasticsearchDistribution, ClientParams } from '@terascope/types';
import { DistributionMetadata } from '../interfaces';

export function convertBulkParams(
    params: ClientParams.BulkParams,
    distributionMeta: DistributionMetadata,
) {
    const { majorVersion, distribution, version } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                type,
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

        if (majorVersion === 6) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
