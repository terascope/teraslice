/* eslint-disable @typescript-eslint/no-empty-interface */
import { ElasticsearchDistribution } from '@terascope/types';
import type { DistributionMetadata } from '../interfaces';
import {
    ExpandWildcards,
    TimeSpan,
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
    scroll?: TimeSpan;
    search_type?: SearchTypes;
    seq_no_primary_term?: boolean;
    size?: number;
    sort?: string;
    _source?: boolean | string;
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    stats?: string | string[];
    stored_fields?: string;
    suggest_field?: string;
    suggest_mode?: SuggestMode;
    suggest_size?: number;
    suggest_text?: string;
    terminate_after?: number;
    timeout?: TimeSpan;
    track_scores?: boolean
    track_total_hits?: boolean | number;
    type?: string;
    typed_keys?: boolean;
    version?: boolean;
}

export interface SearchResponse<T = Record<string, unknown>> {
    took: number;
    timed_out: boolean;
    _scroll_id?: string;
    terminated_early?: boolean;
    max_score?: number;
    fields?: Record<string, any>
    aggregations?: Record<string, AggregationsAggregate>;
    _shards: {
        total: number;
        successful: number;
        skipped: number;
        failed:number;
    },
    hits: {
        total: number | HitsTotal;
        max_score: number;
        hits: SearchResult<T>[]
    }
}

export type AggregationsAggregate =
  | AggregationsSingleBucketAggregate
  | AggregationsAutoDateHistogramAggregate
  | AggregationsFiltersAggregate
  | AggregationsSignificantTermsAggregate<any>
  | AggregationsTermsAggregate<any>
  | AggregationsBucketAggregate
  | AggregationsCompositeBucketAggregate
  | AggregationsMultiBucketAggregate<AggregationsBucket>
  | AggregationsMatrixStatsAggregate
  | AggregationsKeyedValueAggregate
  | AggregationsMetricAggregate;

export interface AggregationsSingleBucketAggregateKeys extends AggregationsAggregateBase {
    doc_count: number;
}

export interface AggregationsKeyedValueAggregate extends AggregationsValueAggregate {
    keys: string[];
}

export type AggregationsCompositeBucket = { [property: string]: AggregationsAggregate };

export type AggregationsDateHistogramBucket = { [property: string]: AggregationsAggregate };

export type AggregationsIpRangeBucket = { [property: string]: AggregationsAggregate };

export interface AggregationsRangeBucketKeys { }
export type AggregationsRangeBucket =
  | AggregationsRangeBucketKeys
  | { [property: string]: AggregationsAggregate };

export type AggregationsRareTermsBucket = { [property: string]: AggregationsAggregate };

export type AggregationsSignificantTermsBucket = { [property: string]: AggregationsAggregate };

export type AggregationsBucket =
  | AggregationsCompositeBucket
  | AggregationsDateHistogramBucket
  | AggregationsFiltersBucketItem
  | AggregationsIpRangeBucket
  | AggregationsRangeBucket
  | AggregationsRareTermsBucket
  | AggregationsSignificantTermsBucket
  | AggregationsKeyedBucket<any>;

export interface AggregationsValueAggregate extends AggregationsAggregateBase {
    value: number;
    value_as_string?: string;
}

export interface AggregationsBoxPlotAggregate extends AggregationsAggregateBase {
    min: number;
    max: number;
    q1: number;
    q2: number;
    q3: number;
}

export interface AggregationsGeoBoundsAggregate extends AggregationsAggregateBase {
    bounds: AggregationsGeoBounds;
}

export interface LatLon {
    lat: number;
    lon: number;
}

export interface AggregationsGeoBounds {
    bottom_right: LatLon;
    top_left: LatLon;
}

export interface AggregationsGeoCentroidAggregate extends AggregationsAggregateBase {
    count: number;
    location: QueryDslGeoLocation;
}

export type QueryDslGeoLocation = string | number[] | LatLon;

export interface AggregationsGeoLineAggregate extends AggregationsAggregateBase {
    type: string;
    geometry: AggregationsLineStringGeoShape;
    properties: AggregationsGeoLineProperties;
}

export interface AggregationsLineStringGeoShape {
    coordinates: QueryDslGeoCoordinate[];
}

export type QueryDslGeoCoordinate = string | number[] | QueryDslThreeDimensionalPoint;

export interface QueryDslThreeDimensionalPoint {
    lat: number;
    lon: number;
    z?: number;
}

export interface AggregationsGeoLineProperties {
    complete: boolean;
    sort_values: number[];
}

export type AggregationsMetricAggregate =
  | AggregationsValueAggregate
  | AggregationsBoxPlotAggregate
  | AggregationsGeoBoundsAggregate
  | AggregationsGeoCentroidAggregate
  | AggregationsGeoLineAggregate
  | AggregationsPercentilesAggregate
  | AggregationsScriptedMetricAggregate
  | AggregationsStatsAggregate
  | AggregationsStringStatsAggregate
  | AggregationsTopHitsAggregate
  | AggregationsTopMetricsAggregate
  | AggregationsExtendedStatsAggregate
  | AggregationsTDigestPercentilesAggregate
  | AggregationsHdrPercentilesAggregate;

export interface AggregationsTDigestPercentilesAggregate extends AggregationsAggregateBase {
    values: Record<string, number>;
}

export interface AggregationsHdrPercentilesAggregate extends AggregationsAggregateBase {
    values: AggregationsHdrPercentileItem[];
}

export interface AggregationsHdrPercentileItem {
    key: number;
    value: number;
}

export interface AggregationsStandardDeviationBounds {
    lower?: number;
    upper?: number;
    lower_population?: number;
    upper_population?: number;
    lower_sampling?: number;
    upper_sampling?: number;
}

export interface AggregationsExtendedStatsAggregate extends AggregationsStatsAggregate {
    std_deviation_bounds: AggregationsStandardDeviationBounds;
    sum_of_squares?: number;
    variance?: number;
    variance_population?: number;
    variance_sampling?: number;
    std_deviation?: number;
    std_deviation_population?: number;
    std_deviation_sampling?: number;
}

export interface AggregationsTopMetricsAggregate extends AggregationsAggregateBase {
    top: AggregationsTopMetrics[];
}

export interface AggregationsTopMetrics {
    sort: (number | number | string)[];
    metrics: Record<string, number | number | string>;
}

export interface SearchHitsMetadata<T = unknown> {
    total: SearchTotalHits | number;
    hits: SearchResult<T>[];
    max_score?: number;
}

export type SearchSortResults = (number | string | null)[];

export interface SearchNestedIdentity {
    field: string;
    offset: number;
    _nested?: SearchNestedIdentity;
}

export interface SearchInnerHitsMetadata {
    total: SearchTotalHits | number;
    hits: SearchResult<Record<string, any>>[];
    max_score?: number;
}

export interface SearchInnerHitsResult {
    hits: SearchInnerHitsMetadata;
}

export interface ExplainExplanation {
    description: string;
    details: ExplainExplanationDetail[];
    value: number;
}

export interface ExplainExplanationDetail {
    description: string;
    details?: ExplainExplanationDetail[];
    value: number;
}

export type SearchTotalHitsRelation = 'eq' | 'gte';

export interface SearchTotalHits {
    relation: SearchTotalHitsRelation;
    value: number;
}

export interface AggregationsTopHitsAggregate extends AggregationsAggregateBase {
    hits: SearchHitsMetadata<Record<string, any>>;
}

export interface AggregationsStringStatsAggregate extends AggregationsAggregateBase {
    count: number;
    min_length: number;
    max_length: number;
    avg_length: number;
    entropy: number;
    distribution?: Record<string, number>;
}
export interface AggregationsScriptedMetricAggregate extends AggregationsAggregateBase {
    value: any;
}

export interface AggregationsStatsAggregate extends AggregationsAggregateBase {
    count: number;
    sum: number;
    avg?: number;
    max?: number;
    min?: number;
}

export interface AggregationsPercentilesAggregate extends AggregationsAggregateBase {
    items: AggregationsPercentileItem[];
}

export interface AggregationsPercentileItem {
    percentile: number;
    value: number;
}

export interface AggregationsMatrixStatsAggregate extends AggregationsAggregateBase {
    correlation: Record<string, number>;
    covariance: Record<string, number>;
    count: number;
    kurtosis: number;
    mean: number;
    skewness: number;
    variance: number;
    name: string;
}

export interface AggregationsCompositeBucketAggregate
    extends AggregationsMultiBucketAggregate<Record<string, any>> {
    after_key: Record<string, any>;
}

export interface AggregationsFiltersAggregate extends AggregationsAggregateBase {
    buckets: AggregationsFiltersBucketItem[] | Record<string, AggregationsFiltersBucketItem>;
}
export interface AggregationsBucketAggregate extends AggregationsAggregateBase {
    after_key: Record<string, any>;
    bg_count: number;
    doc_count: number;
    doc_count_error_upper_bound: number;
    sum_other_doc_count: number;
    interval: string;
    items: AggregationsBucket;
}

export interface AggregationsTermsAggregate<TKey = unknown>
    extends AggregationsMultiBucketAggregate<TKey> {
    doc_count_error_upper_bound: number;
    sum_other_doc_count: number;
}

export interface AggregationsSignificantTermsAggregate<TKey = unknown>
    extends AggregationsMultiBucketAggregate<TKey> {
    bg_count: number;
    doc_count: number;
}

export interface AggregationsFiltersBucketItemKeys {
    doc_count: number;
}
export type AggregationsFiltersBucketItem =
    | AggregationsFiltersBucketItemKeys
    | { [property: string]: AggregationsAggregate };

export interface AggregationsMultiBucketAggregate<TBucket = unknown>
    extends AggregationsAggregateBase {
    buckets: TBucket[];
}

export interface AggregationsAggregateBase {
    meta?: Record<string, any>;
}

export interface AggregationsKeyedBucketKeys<TKey = unknown> {
    doc_count: number;
    key: TKey;
    key_as_string: string;
}

export interface AggregationsAutoDateHistogramAggregate
    extends AggregationsMultiBucketAggregate<AggregationsKeyedBucket<number>> {
    interval: string;
}

export type AggregationsKeyedBucket<TKey = unknown> =
  | AggregationsKeyedBucketKeys<TKey>
  | { [property: string]: AggregationsAggregate };

export type AggregationsSingleBucketAggregate =
    | AggregationsSingleBucketAggregateKeys
    | { [property: string]: AggregationsAggregate };

interface HitsTotal {
    value: number;
    relation: 'eq' | 'gte';
}

export function convertSearchParams(
    params: SearchParams,
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

    qDependentFieldsCheck(parsedParams);

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8 || majorVersion === 7) {
            return parsedParams;
        }

        if (majorVersion === 6) {
            return {
                type,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return parsedParams;
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
