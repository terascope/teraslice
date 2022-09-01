import { ElasticsearchDistribution } from '@terascope/types';
import { ShardStatistics, ExpandWildcards } from './interfaces';
import type { DistributionMetadata } from '../interfaces';
import type { IndicesIndexRouting } from './nodesInfo';

export interface IndicesPutSettingsParams {
    index?: string | string []
    allow_no_indices?: boolean
    expand_wildcards?: ExpandWildcards
    flat_settings?: boolean
    ignore_unavailable?: boolean
    cluster_manager_timeout?: number | string
    master_timeout?: number | string
    preserve_existing?: boolean
    timeout?: number | string
    body: IndicesPutSettingsIndexSettingsBody
}

export interface IndicesPutSettingsIndexSettingsBody extends IndicesIndexSettings {
    settings?: IndicesIndexSettings;
}

export type IndicesIndexCheckOnStartup = 'false' | 'checksum' | 'true';

export interface IndicesIndexSettings {
    number_of_shards?: number | string;
    'index.number_of_shards'?: number | string;
    number_of_replicas?: number | string;
    'index.number_of_replicas'?: number | string;
    number_of_routing_shards?: number;
    'index.number_of_routing_shards'?: number;
    check_on_startup?: IndicesIndexCheckOnStartup;
    'index.check_on_startup'?: IndicesIndexCheckOnStartup;
    codec?: string;
    'index.codec'?: string;
    routing_partition_size?: number | string;
    'index.routing_partition_size'?: number | string;
    'soft_deletes.retention_lease.period'?: number | string;
    'index.soft_deletes.retention_lease.period'?: number | string;
    load_fixed_bitset_filters_eagerly?: boolean;
    'index.load_fixed_bitset_filters_eagerly'?: boolean;
    hidden?: boolean | string;
    'index.hidden'?: boolean | string;
    auto_expand_replicas?: string;
    'index.auto_expand_replicas'?: string;
    'search.idle.after'?: number | string;
    'index.search.idle.after'?: number | string;
    refresh_interval?: number | string;
    'index.refresh_interval'?: number | string;
    max_result_window?: number;
    'index.max_result_window'?: number;
    max_inner_result_window?: number;
    'index.max_inner_result_window'?: number;
    max_rescore_window?: number;
    'index.max_rescore_window'?: number;
    max_docvalue_fields_search?: number;
    'index.max_docvalue_fields_search'?: number;
    max_script_fields?: number;
    'index.max_script_fields'?: number;
    max_ngram_diff?: number;
    'index.max_ngram_diff'?: number;
    max_shingle_diff?: number;
    'index.max_shingle_diff'?: number;
    blocks?: IndicesIndexSettingBlocks;
    'index.blocks'?: IndicesIndexSettingBlocks;
    max_refresh_listeners?: number;
    'index.max_refresh_listeners'?: number;
    'analyze.max_token_count'?: number;
    'index.analyze.max_token_count'?: number;
    'highlight.max_analyzed_offset'?: number;
    'index.highlight.max_analyzed_offset'?: number;
    max_terms_count?: number;
    'index.max_terms_count'?: number;
    max_regex_length?: number;
    'index.max_regex_length'?: number;
    routing?: IndicesIndexRouting;
    'index.routing'?: IndicesIndexRouting;
    gc_deletes?: number | string;
    'index.gc_deletes'?: number | string;
    default_pipeline?: string;
    'index.default_pipeline'?: string;
    final_pipeline?: string;
    'index.final_pipeline'?: string;
    lifecycle?: IndicesIndexSettingsLifecycle;
    'index.lifecycle'?: IndicesIndexSettingsLifecycle;
    provided_name?: string;
    'index.provided_name'?: string;
    creation_date?: string;
    'index.creation_date'?: string;
    uuid?: string;
    'index.uuid'?: string;
    version?: IndicesIndexVersioning;
    'index.version'?: IndicesIndexVersioning;
    verified_before_close?: boolean | string;
    'index.verified_before_close'?: boolean | string;
    format?: string | number;
    'index.format'?: string | number;
    max_slices_per_scroll?: number;
    'index.max_slices_per_scroll'?: number;
    'translog.durability'?: string;
    'index.translog.durability'?: string;
    'query_string.lenient'?: boolean | string;
    'index.query_string.lenient'?: boolean | string;
    priority?: number | string;
    'index.priority'?: number | string;
    top_metrics_max_size?: number;
    analysis?: IndicesIndexSettingsAnalysis;
}

export interface IndicesIndexSettingsLifecycle {
    name: string;
}

export interface IndicesIndexVersioning {
    created: string;
}

export interface IndicesIndexSettingBlocks {
    read_only?: boolean;
    'index.blocks.read_only'?: boolean;
    read_only_allow_delete?: boolean;
    'index.blocks.read_only_allow_delete'?: boolean;
    read?: boolean;
    'index.blocks.read'?: boolean;
    write?: boolean | string;
    'index.blocks.write'?: boolean | string;
    metadata?: boolean;
    'index.blocks.metadata'?: boolean;
}

export interface IndicesIndexSettingsAnalysis {
    char_filter?: Record<string, AnalysisCharFilter>;
}

export type AnalysisCharFilter =
  | AnalysisHtmlStripCharFilter
  | AnalysisMappingCharFilter
  | AnalysisPatternReplaceTokenFilter;

export type AnalysisHtmlStripCharFilter = AnalysisCharFilterBase

export interface AnalysisMappingCharFilter extends AnalysisCharFilterBase {
    mappings: string[];
    mappings_path: string;
}

export interface AnalysisPatternReplaceTokenFilter extends AnalysisTokenFilterBase {
    flags: string;
    pattern: string;
    replacement: string;
}

export interface AnalysisTokenFilterBase {
    type: string;
    version?: string;
}

export interface AnalysisCharFilterBase {
    type: string;
    version?: string;
}

export interface IndicesPutSettingsResponse {
    _shards: ShardStatistics
}

export function convertIndicesPutSettingsParams(
    params: IndicesPutSettingsParams,
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                body,
                ...parsedParams
            } = params;

            return {
                settings: body,
                ...parsedParams
            };
        }

        if (majorVersion === 7 || majorVersion === 6) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                master_timeout,
                ...parsedParams
            } = params;

            // they are renaming their parameters
            if (master_timeout) {
                parsedParams.cluster_manager_timeout = master_timeout;
            }

            return parsedParams;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
