import { ElasticsearchDistribution } from '@terascope/types';
import { ShardStatistics, ExpandWildcards } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesRefreshParams {
    index?: string ;
    allow_no_indices?: boolean;
    expand_wildcards?: ExpandWildcards;
    ignore_unavailable?: boolean;
}

export type IndicesRefreshResponse = ShardsOperationResponseBase

export interface ShardsOperationResponseBase {
    _shards: ShardStatistics;
}

export function convertIndicesRefreshParams(
    params: IndicesRefreshParams,
    distributionMeta: DistributionMetadata
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

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
