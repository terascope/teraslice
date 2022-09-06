import { ElasticsearchDistribution } from '@terascope/types';
import type { DistributionMetadata } from '../interfaces';

export interface ExistsParams {
    id: string;
    index: string;
    type?: string;
    preference?: string;
    realtime?: boolean;
    refresh?: boolean;
    routing?: string;
}

export type ExistsResponse = boolean;

export function convertExistsParams(
    params: ExistsParams,
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    const {
        type = '_doc',
        ...parsedParams
    } = params;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8 || majorVersion === 7) return parsedParams;

        if (majorVersion === 6) {
            return {
                type,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) return parsedParams;
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
