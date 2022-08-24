import { ElasticsearchDistribution } from '@terascope/types';
import type { BulkIndexByScrollFailure } from './interfaces';
import type { Semver } from '../interfaces';

export interface DeleteByQueryResponse {
    batches?: number;
    deleted?: number;
    failures?: BulkIndexByScrollFailure[];
    noops?: number;
    requests_per_second?: number;
    retries?: {
        bulk: number;
        search: number;
    };
    slice_id?: number;
    task?: string | number;
    throttled_millis?: number;
    throttled_until_millis?: number;
    timed_out?: boolean;
    took?: number;
    total?: number;
    version_conflicts?: number;
}

export interface DeleteByQueryParams {
    index: string | string[];
    type?: string | string[];
    analyzer?: string;
    analyze_wildcard?: boolean;
    from?: number;
    ignore_unavailable?: boolean;
    allow_no_indices?: boolean;
    conflicts?: 'abort' | 'proceed';
    expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
    lenient?: boolean;
    preference?: string;
    q?: string;
    routing?: string | string[];
    scroll?: string;
    search_type?: 'query_then_fetch' | 'dfs_query_then_fetch';
    search_timeout?: string;
    size?: number;
    max_docs?: number;
    sort?: string | string[];
    terminate_after?: number;
    stats?: string | string[];
    version?: boolean;
    request_cache?: boolean;
    refresh?: boolean;
    timeout?: string;
    wait_for_active_shards?: string;
    scroll_size?: number;
    wait_for_completion?: boolean;
    requests_per_second?: number;
    slices?: number | string;
    body?: Record<string, any>,
}

export function convertDeleteByQueryParams(
    params: Record<string, any>,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            // make sure to remove type
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 7) {
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 6) {
            return params;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}
