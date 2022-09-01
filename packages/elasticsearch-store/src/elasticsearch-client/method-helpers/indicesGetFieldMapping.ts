import { ElasticsearchDistribution } from '@terascope/types';
import { ExpandWildcards } from './interfaces';
import type { MappingProperty } from './indicesGetSettings';
import type { DistributionMetadata } from '../interfaces';

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
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    const {
        include_type_name,
        type = '_doc',
        ...parsedParams
    } = params;

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
