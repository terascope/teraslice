import { ElasticsearchDistribution } from '@terascope/types';
import { ShardStatistics, ExpandWildcards } from './interfaces';
import type { Semver } from '../interfaces';

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
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            return params;
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            return params;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }

        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}
