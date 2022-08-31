import { ElasticsearchDistribution } from '@terascope/types';
import { ExpandWildcards, ShardStatistics } from './interfaces';
import type {
    MappingProperty, MappingAllField, MappingDynamicMapping,
    MappingDynamicTemplate, MappingRuntimeField
} from './indicesGetSettings';
import type { MappingFieldMapping } from './indicesGetFieldMapping';
import type { Semver } from '../interfaces';

export interface IndicesPutMappingParams {
    index?: string | string []
    type?: string
    include_type_name?: boolean
    allow_no_indices?: boolean
    expand_wildcards?: ExpandWildcards
    ignore_unavailable?: boolean
    master_timeout?: string | number
    timeout?: string | number
    write_index_only?: boolean
    body?: {
        all_field?: MappingAllField;
        date_detection?: boolean;
        dynamic?: boolean | MappingDynamicMapping;
        dynamic_date_formats?: string[];
        dynamic_templates?:
        | Record<string, MappingDynamicTemplate>
        | Record<string, MappingDynamicTemplate>[];
        field_names_field?: MappingFieldNamesField;
        index_field?: MappingIndexField;
        meta?: Record<string, any>;
        numeric_detection?: boolean;
        properties?: Record<string, MappingProperty>;
        routing_field?: MappingRoutingField;
        size_field?: MappingSizeField;
        source_field?: MappingSourceField;
        runtime?: MappingRuntimeFields;
    };
}

export interface IndicesPutMappingResponse extends IndicesResponseBase {
    _shards: ShardStatistics
}

export type MappingRuntimeFields = Record<string, MappingRuntimeField>;

export interface MappingRoutingField {
    required: boolean;
}

export interface MappingSourceField {
    compress?: boolean;
    compress_threshold?: string;
    enabled: boolean;
    excludes?: string[];
    includes?: string[];
}

export interface MappingSizeField {
    enabled: boolean;
}

export interface MappingIndexField {
    enabled: boolean;
}

export interface MappingFieldNamesField {
    enabled: boolean;
}

export interface IndicesResponseBase {
    _shards?: ShardStatistics;
    acknowledged: boolean;
}

export interface IndicesPutMappingTypeFieldMappings {
    mappings: Partial<Record<string, MappingFieldMapping>>
}

export function convertIndicesPutMappingParams(
    params: IndicesPutMappingParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                include_type_name, type,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 7) {
            const {
                include_type_name, type,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 6) {
            const {
                write_index_only,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                include_type_name, type, master_timeout,
                ...parsedParams
            } = params;

            if (master_timeout) {
                // @ts-expect-error
                parsedParams.cluster_manager_timeout = master_timeout;
            }

            return parsedParams;
        }

        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}
