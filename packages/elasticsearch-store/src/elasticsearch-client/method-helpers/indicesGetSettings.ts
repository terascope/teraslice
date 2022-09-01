import { ElasticsearchDistribution } from '@terascope/types';
import { Script, ExpandWildcards } from './interfaces';
import type { IndicesIndexSettings } from './indicesPutSettings';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesGetSettingsParams {
    index?: string | string[]
    name?: string | string[]
    allow_no_indices?: boolean
    expand_wildcards?: ExpandWildcards
    flat_settings?: boolean
    ignore_unavailable?: boolean
    include_defaults?: boolean
    local?: boolean
    master_timeout?: number | string
}

export interface IndicesGetSettingsResponse {
    [key: string]: IndicesIndexState
}

export interface IndicesIndexState {
    aliases?: Record<string, IndicesAlias>;
    mappings?: MappingTypeMapping;
    settings: IndicesIndexSettings | IndicesIndexStatePrefixedSettings;
}

export interface MappingTypeMapping {
    all_field?: MappingAllField;
    date_detection?: boolean;
    dynamic?: boolean | MappingDynamicMapping;
    dynamic_date_formats?: string[];
    dynamic_templates?:
    | Record<string, MappingDynamicTemplate>
    | Record<string, MappingDynamicTemplate>[];
    _field_names?: {
        enabled: boolean;
    };
    index_field?: {
        enabled: boolean;
    };
    _meta?: Record<string, unknown>;
    numeric_detection?: boolean;
    properties?: Record<string, MappingProperty>;
    _routing?: {
        required: boolean;
    };
    _size?: {
        enabled: boolean;
    };
    _source?: {
        compress?: boolean;
        compress_threshold?: string;
        enabled: boolean;
        excludes?: string[];
        includes?: string[];
    };
    runtime?: Record<string, MappingRuntimeField>;
}

export interface MappingRuntimeField {
    format?: string;
    script?: Script;
    type: MappingRuntimeFieldType;
}

export type MappingRuntimeFieldType =
    | 'boolean'
    | 'date'
    | 'number'
    | 'geo_point'
    | 'ip'
    | 'keyword'
    | 'long';

export interface MappingDynamicTemplate {
    mapping?: MappingPropertyBase;
    match?: string;
    match_mapping_type?: string;
    match_pattern?: MappingMatchType;
    path_match?: string;
    path_unmatch?: string;
    unmatch?: string;
}

export interface MappingPropertyBase {
    local_metadata?: Record<string, any>;
    meta?: Record<string, string>;
    name?: string;
    properties?: Record<string, MappingProperty>;
    ignore_above?: number;
    dynamic?: boolean | MappingDynamicMapping;
    fields?: Record<string, MappingProperty>;
}

export type MappingProperty =
  | MappingFlattenedProperty
  | MappingJoinProperty
  | MappingPercolatorProperty
  | MappingRankFeatureProperty
  | MappingRankFeaturesProperty
  | MappingConstantKeywordProperty
  | MappingFieldAliasProperty
  | MappingHistogramProperty
  | MappingCoreProperty;

export interface MappingFlattenedProperty extends MappingPropertyBase {
    boost?: number;
    depth_limit?: number;
    doc_values?: boolean;
    eager_global_ordinals?: boolean;
    index?: boolean;
    index_options?: MappingIndexOptions;
    null_value?: string;
    similarity?: string;
    split_queries_on_whitespace?: boolean;
    type: 'flattened';
}

export type MappingCoreProperty =
  | MappingObjectProperty
  | MappingNestedProperty
  | MappingSearchAsYouTypeProperty
  | MappingTextProperty
  | MappingDocValuesProperty;

export type MappingDocValuesProperty =
  | MappingBinaryProperty
  | MappingBooleanProperty
  | MappingDateProperty
  | MappingDateNanosProperty
  | MappingKeywordProperty
  | MappingNumberProperty
  | MappingRangeProperty
  | MappingGeoPointProperty
  | MappingGeoShapeProperty
  | MappingCompletionProperty
  | MappingIpProperty
  | MappingMurmur3HashProperty
  | MappingShapeProperty
  | MappingTokenCountProperty
  | MappingVersionProperty
  | MappingWildcardProperty
  | MappingPointProperty

export interface MappingBooleanProperty extends MappingDocValuesPropertyBase {
    boost?: number
    fielddata?: IndicesNumericFielddata
    index?: boolean
    null_value?: boolean
    type: 'boolean'
}

export interface IndicesNumericFielddata {
    format: IndicesNumericFielddataFormat
}

export type IndicesNumericFielddataFormat = 'array' | 'disabled'

export interface MappingPointProperty extends MappingDocValuesPropertyBase {
    ignore_malformed?: boolean
    ignore_z_value?: boolean
    null_value?: string
    type: 'point'
}

export interface MappingWildcardProperty extends MappingDocValuesPropertyBase {
    type: 'wildcard'
    null_value?: string
}

export interface MappingVersionProperty extends MappingDocValuesPropertyBase {
    type: 'version'
}

export interface MappingTokenCountProperty extends MappingDocValuesPropertyBase {
    analyzer?: string
    boost?: number
    index?: boolean
    null_value?: number
    enable_position_increments?: boolean
    type: 'token_count'
}

export interface MappingShapeProperty extends MappingDocValuesPropertyBase {
    coerce?: boolean
    ignore_malformed?: boolean
    ignore_z_value?: boolean
    orientation?: MappingGeoOrientation
    type: 'shape'
}

export type MappingGeoOrientation = 'right' | 'RIGHT' | 'counterclockwise' | 'ccw' | 'left' | 'LEFT' | 'clockwise' | 'cw'

export interface MappingMurmur3HashProperty extends MappingDocValuesPropertyBase {
    type: 'murmur3'
}

export interface MappingIpProperty extends MappingDocValuesPropertyBase {
    boost?: number
    index?: boolean
    null_value?: string
    ignore_malformed?: boolean
    type: 'ip'
}

export interface MappingCompletionProperty extends MappingDocValuesPropertyBase {
    analyzer?: string
    contexts?: MappingSuggestContext[]
    max_input_length?: number
    preserve_position_increments?: boolean
    preserve_separators?: boolean
    search_analyzer?: string
    type: 'completion'
}

export interface MappingSuggestContext {
    name: string
    path?: string
    type: string
    precision?: number | string
}

export type MappingGeoStrategy = 'recursive' | 'term'

export interface MappingGeoShapeProperty extends MappingDocValuesPropertyBase {
    coerce?: boolean
    ignore_malformed?: boolean
    ignore_z_value?: boolean
    orientation?: MappingGeoOrientation
    strategy?: MappingGeoStrategy
    type: 'geo_shape'
}

export interface MappingGeoPointProperty extends MappingDocValuesPropertyBase {
    ignore_malformed?: boolean
    ignore_z_value?: boolean
    null_value?: GeoLocation
    type: 'geo_point'
}

export type GeoLocation = LatLonGeoLocation | GeoHashLocation | number[] | string

export interface LatLonGeoLocation {
    lat: number
    lon: number
}

export type GeoHash = string

export interface GeoHashLocation {
    geohash: GeoHash
}

export interface MappingLongRangeProperty extends MappingRangePropertyBase {
    type: 'long_range'
}

export interface MappingIpRangeProperty extends MappingRangePropertyBase {
    type: 'ip_range'
}

export interface MappingRangePropertyBase extends MappingDocValuesPropertyBase {
    boost?: number
    coerce?: boolean
    index?: boolean
}

export interface MappingIntegerRangeProperty extends MappingRangePropertyBase {
    type: 'integer_range'
}

export interface MappingDoubleRangeProperty extends MappingRangePropertyBase {
    type: 'double_range'
}

export type MappingRangeProperty =
  | MappingLongRangeProperty
  | MappingIpRangeProperty
  | MappingIntegerRangeProperty
  | MappingFloatRangeProperty
  | MappingDoubleRangeProperty
  | MappingDateRangeProperty

export type MappingNumberProperty =
  | MappingFloatNumberProperty
  | MappingHalfFloatNumberProperty
  | MappingDoubleNumberProperty
  | MappingIntegerNumberProperty
  | MappingLongNumberProperty
  | MappingShortNumberProperty
  | MappingByteNumberProperty
  | MappingUnsignedLongNumberProperty
  | MappingScaledFloatNumberProperty

export interface MappingFloatNumberProperty extends MappingStandardNumberProperty {
    type: 'float'
    null_value?: number
}

export interface MappingNumberPropertyBase extends MappingDocValuesPropertyBase {
    index?: boolean
    ignore_malformed?: boolean
    time_series_metric?: MappingTimeSeriesMetricType
}

export type MappingTimeSeriesMetricType = 'gauge' | 'counter' | 'summary' | 'histogram'

export interface MappingStandardNumberProperty extends MappingNumberPropertyBase {
    coerce?: boolean
    script?: Script
    on_script_error?: MappingOnScriptError
}

export type MappingOnScriptError = 'fail' | 'continue'

export interface MappingScaledFloatNumberProperty extends MappingNumberPropertyBase {
    type: 'scaled_float'
    coerce?: boolean
    null_value?: number
    scaling_factor?: number
}

export interface MappingUnsignedLongNumberProperty extends MappingNumberPropertyBase {
    type: 'unsigned_long'
    null_value?: number
}

export interface MappingByteNumberProperty extends MappingStandardNumberProperty {
    type: 'byte'
    null_value?: number
}

export interface MappingShortNumberProperty extends MappingStandardNumberProperty {
    type: 'short'
    null_value?: number
}

export interface MappingLongNumberProperty extends MappingStandardNumberProperty {
    type: 'long'
    null_value?: number
}

export interface MappingIntegerNumberProperty extends MappingStandardNumberProperty {
    type: 'integer'
    null_value?: number
}

export interface MappingDoubleNumberProperty extends MappingStandardNumberProperty {
    type: 'double'
    null_value?: number
}

export interface MappingHalfFloatNumberProperty extends MappingStandardNumberProperty {
    type: 'half_float'
    null_value?: number
}

export interface MappingKeywordProperty extends MappingDocValuesPropertyBase {
    boost?: number
    eager_global_ordinals?: boolean
    index?: boolean
    index_options?: MappingIndexOptions
    normalizer?: string
    norms?: boolean
    null_value?: string
    split_queries_on_whitespace?: boolean
    time_series_dimension?: boolean
    type: 'keyword'
}

export interface MappingDateNanosProperty extends MappingDocValuesPropertyBase {
    boost?: number
    format?: string
    ignore_malformed?: boolean
    index?: boolean
    null_value?: string
    precision_step?: number
    type: 'date_nanos'
}

export interface MappingDateProperty extends MappingDocValuesPropertyBase {
    boost?: number
    fielddata?: IndicesNumericFielddata
    format?: string
    ignore_malformed?: boolean
    index?: boolean
    null_value?: string
    precision_step?: number
    locale?: string
    type: 'date'
}

export interface MappingDateRangeProperty extends MappingRangePropertyBase {
    format?: string
    type: 'date_range'
}

export interface MappingBinaryProperty extends MappingDocValuesPropertyBase {
    type: 'binary'
}

export interface MappingObjectProperty extends MappingCorePropertyBase {
    enabled?: boolean;
    type?: 'object';
}

export interface MappingDocValuesPropertyBase extends MappingCorePropertyBase {
    doc_values?: boolean;
}

export interface MappingTextProperty extends MappingCorePropertyBase {
    analyzer?: string;
    boost?: number;
    eager_global_ordinals?: boolean;
    fielddata?: boolean;
    fielddata_frequency_filter?: IndicesFielddataFrequencyFilter;
    index?: boolean;
    index_options?: MappingIndexOptions;
    index_phrases?: boolean;
    index_prefixes?: MappingTextIndexPrefixes;
    norms?: boolean;
    position_increment_gap?: number;
    search_analyzer?: string;
    search_quote_analyzer?: string;
    term_vector?: MappingTermVectorOption;
    type: 'text';
}

export type MappingTermVectorOption = 'no' | 'yes' | 'with_offsets' | 'with_positions' | 'with_positions_offsets' | 'with_positions_offsets_payloads' | 'with_positions_payloads'

export interface MappingTextIndexPrefixes {
    max_chars: number
    min_chars: number
}

export interface IndicesFielddataFrequencyFilter {
    max: number
    min: number
    min_segment_size: number
}

export interface MappingSearchAsYouTypeProperty extends MappingCorePropertyBase {
    analyzer?: string;
    index?: boolean;
    index_options?: MappingIndexOptions;
    max_shingle_size?: number;
    norms?: boolean;
    search_analyzer?: string;
    search_quote_analyzer?: string;
    term_vector?: MappingTermVectorOption;
    type: 'search_as_you_type';
}

export interface MappingCorePropertyBase extends MappingPropertyBase {
    copy_to?: string | string[];
    similarity?: string;
    store?: boolean;
}

export type MappingIndexOptions = 'docs' | 'freqs' | 'positions' | 'offsets';

export interface MappingNestedProperty extends MappingCorePropertyBase {
    enabled?: boolean;
    include_in_parent?: boolean;
    include_in_root?: boolean;
    type: 'nested';
}

export interface MappingHistogramProperty extends MappingPropertyBase {
    ignore_malformed?: boolean;
    type: 'histogram';
}

export interface MappingFieldAliasProperty extends MappingPropertyBase {
    path?: string;
    type: 'alias';
}

export interface MappingConstantKeywordProperty extends MappingPropertyBase {
    value?: any;
    type: 'constant_keyword';
}

export interface MappingRankFeatureProperty extends MappingPropertyBase {
    positive_score_impact?: boolean;
    type: 'rank_feature';
}

export interface MappingRankFeaturesProperty extends MappingPropertyBase {
    type: 'rank_features';
}

export interface MappingPercolatorProperty extends MappingPropertyBase {
    type: 'percolator';
}

export interface MappingJoinProperty extends MappingPropertyBase {
    relations?: Record<string, string | string[]>;
    type: 'join';
}

export interface MappingFloatRangeProperty extends MappingRangePropertyBase {
    type: 'float_range';
}

export type MappingMatchType = 'simple' | 'regex';

export type MappingDynamicMapping = 'strict' | 'runtime' | 'true' | 'false';

export interface MappingAllField {
    analyzer: string;
    enabled: boolean;
    omit_norms: boolean;
    search_analyzer: string;
    similarity: string;
    store: boolean;
    store_term_vector_offsets: boolean;
    store_term_vector_payloads: boolean;
    store_term_vector_positions: boolean;
    store_term_vectors: boolean;
}

export interface IndicesAlias {
    filter?: Record<string, any>;
    index_routing?: string;
    is_hidden?: boolean;
    is_write_index?: boolean;
    routing?: string;
    search_routing?: string;
}

export interface IndicesIndexStatePrefixedSettings {
    index: IndicesIndexSettings;
}

export function convertIndicesGetSettingsParams(
    params: IndicesGetSettingsParams,
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
            const {
                master_timeout, ...parsedParams
            } = params;

            if (master_timeout) {
                // @ts-expect-error
                parsedParams.cluster_manager_timeout = master_timeout;
            }

            return parsedParams;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
