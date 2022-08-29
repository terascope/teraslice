import { ElasticsearchDistribution } from '@terascope/types';
import { ExpandWildcards } from './interfaces';
import type { MappingProperty } from './indicesGetSettings';
import type { Semver } from '../interfaces';

export interface IndicesGetFieldMappingParams {
    fields: string | string[]
    index?: string | string[]
    include_type_name?: boolean;
    type?: string | string[];
    allow_no_indices?: boolean
    expand_wildcards?: ExpandWildcards
    ignore_unavailable?: boolean
    include_defaults?: boolean
    local?: boolean
}

export type IndicesGetFieldMappingResponse = Record<string, IndicesGetFieldMappingTypeFieldMappings>

export interface IndicesGetFieldMappingTypeFieldMappings {
    mappings: Partial<Record<string, MappingFieldMapping>>
}

export interface MappingFieldMapping {
    full_name: string
    mapping: Partial<Record<string, MappingProperty>>
}

export function convertIndicesGetFieldMappingParams(
    params: IndicesGetFieldMappingParams,
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
            return params;
        }

        if (majorVersion === 6) {
            return params;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                include_type_name, type,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}
