import { ElasticsearchDistribution } from '@terascope/types';
import type { ExpandWildcards } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesExistsParams {
    index: string | string[];
    local?: boolean;
    ignore_unavailable?: boolean;
    allow_no_indices?: boolean;
    expand_wildcards?: ExpandWildcards
    flat_settings?: boolean;
    include_defaults?: boolean;
}

export type IndicesExistsResponse = boolean;

export function convertIndicesExistsParams(
    params: IndicesExistsParams,
    distributionMeta: DistributionMetadata,
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([6, 7, 8].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}
