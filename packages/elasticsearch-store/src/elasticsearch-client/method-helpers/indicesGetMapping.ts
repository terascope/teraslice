import { ElasticsearchDistribution } from '@terascope/types';
import { ExpandWildcards } from './interfaces';
import type { MappingTypeMapping } from './indicesGetSettings';
import type { Semver } from '../interfaces';

export interface IndicesGetMappingParams {
    index?: string | string[]
    type?: string | string[];
    include_type_name?: boolean;
    allow_no_indices?: boolean
    expand_wildcards?: ExpandWildcards
    ignore_unavailable?: boolean
    local?: boolean
    master_timeout?: string | number
}

export type IndicesGetMappingResponse = Record<string, IndicesGetMappingIndexMappingRecord>

export interface IndicesGetMappingIndexMappingRecord {
    item?: MappingTypeMapping;
    mappings: MappingTypeMapping;
}

export function convertIndicesGetMappingParams(
    params: IndicesGetMappingParams,
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
            return params;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                master_timeout, type, include_type_name,
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
