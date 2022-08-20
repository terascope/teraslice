import { ElasticsearchDistribution } from '@terascope/types';
import { MSearchParams } from './interfaces';
import type { Semver } from '../interfaces';

/*
es6
method?: string;
ignore?: number | number[];
filter_path?: string | string[];
pretty?: boolean;
human?: boolean;
error_trace?: boolean;
source?: string;
index?: string | string[];
type?: string | string[];
search_type?: 'query_then_fetch' | 'query_and_fetch'
max_concurrent_searches?: number;
typed_keys?: boolean;
pre_filter_shard_size?: number;
max_concurrent_shard_requests?: number;
rest_total_hits_as_int?: boolean;
body: T;
*/

/*
es8
index?: Indices;
allow_no_indices?: boolean;
ccs_minimize_roundtrips?: boolean;
expand_wildcards?: ExpandWildcards;
ignore_throttled?: boolean;
ignore_unavailable?: boolean;
max_concurrent_searches?: long;
max_concurrent_shard_requests?: long;
pre_filter_shard_size?: long;
search_type?: SearchType;
rest_total_hits_as_int?: boolean;
typed_keys?: boolean;
searches?: MsearchRequestItem[];

aggregations?: Record<string, AggregationsAggregationContainer>;
aggs?: Record<string, AggregationsAggregationContainer>;
query?: QueryDslQueryContainer;
from?: integer;
size?: integer;
pit?: SearchPointInTimeReference;
track_total_hits?: SearchTrackHits;
suggest?: SearchSuggester;

allow_no_indices?: boolean;
expand_wildcards?: ExpandWildcards;
ignore_unavailable?: boolean;
index?: Indices;
preference?: string;
request_cache?: boolean;
routing?: string;
search_type?: SearchType;
*/

export function convertMSearchParams(
    params: MSearchParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;

    const parsedParams: Record<string, any> = params;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            if (params.type) delete parsedParams.type;
            if (params.body) {
                parsedParams.searches = params.body;
                delete parsedParams.body;
            }

            return params;
        }

        if (majorVersion === 7) {
            return parsedParams;
        }

        if (majorVersion === 6) {
            delete parsedParams.ccs_minimize_roundtrips;

            return parsedParams;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return parsedParams;
        }
    }

    throw new Error(`${distribution} version ${version} is not supported`);
}
