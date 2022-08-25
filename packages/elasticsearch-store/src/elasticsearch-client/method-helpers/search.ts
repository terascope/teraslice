import { ElasticsearchDistribution } from '@terascope/types';
import type { Semver } from '../interfaces';
import {
    ExpandWildcards,
    TimeValue,
    SearchTypes,
    SuggestMode,
    SearchResult
} from './interfaces';

export interface SearchParams {
    allow_no_indices?: boolean;
    allow_partial_search_results?: boolean;
    analyzer?: string;
    analyze_wildcard?: boolean;
    batched_reduce_size?: number;
    body?: Record<string, any>;
    ccs_minimize_roundtrips?: boolean;
    default_operator?: string;
    df?: string;
    docvalue_fields?: string;
    expand_wildcards?: ExpandWildcards,
    explain?: boolean;
    from?:number;
    index?: string | string[];
    ignore?: number | number[];
    ignore_throttled?: boolean;
    ignore_unavailable?: boolean;
    lenient?: boolean;
    max_concurrent_shard_requests?: number;
    min_compatible_shard_node?: string;
    pre_filter_shard_size?: number;
    preference?: string; // define this
    q?: string;
    request_cache?: boolean;
    rest_total_hits_as_int?: boolean;
    routing?: string;
    scroll?: TimeValue;
    search_type?: SearchTypes;
    seq_no_primary_term?: boolean;
    size?: number;
    sort?: string;
    _source?: boolean | string;
    _source_excludes?: string;
    _source_includes?: string;
    stats?: string | string[];
    stored_fields?: string;
    suggest_field?: string;
    suggest_mode?: SuggestMode;
    suggest_size?: number;
    suggest_text?: string;
    terminate_after?: number;
    timeout?: TimeValue;
    track_scores?: boolean
    track_total_hits?: boolean | number;
    type?: string;
    typed_keys?: boolean;
    version?: boolean;
}

export interface SearchResponse {
    took: number;
    timed_out: boolean;
    _scroll_id?: string;
    _shards: {
        total: number;
        successful: number;
        skipped: number;
        failed:number;
    },
    hits: {
        total: number | HitsTotal;
        max_score: number;
        hits: SearchResult[]
    }
}

interface HitsTotal {
    value: number;
    relation: 'eq' | 'gte';
}

export function convertSearchParams(
    params: SearchParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;

    qDependentFieldsCheck(params);

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                type,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 7 || majorVersion === 6) {
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

function qDependentFieldsCheck(params: SearchParams) {
    const requiresQ = [
        'analyzer',
        'analyze_wildcard',
        'default_operator',
        'df',
        'lenient'
    ];

    const hasQDependentFields = requiresQ.filter((field) => params[field] != null);

    if (hasQDependentFields.length && params.q == null) {
        throw new Error(`${hasQDependentFields.join(', ')} requires q parameter`);
    }
}
