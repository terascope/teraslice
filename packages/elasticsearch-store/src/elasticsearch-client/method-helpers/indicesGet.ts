import { ElasticsearchDistribution } from '@terascope/types';
import type { ExpandWildcards, TimeSpan } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesGetParams {
    index: string | string[];
    include_type_name?: boolean;
    local?: boolean;
    ignore_unavailable?: boolean;
    allow_no_indices?: boolean;
    expand_wildcards?: ExpandWildcards;
    flat_settings?: boolean;
    include_defaults?: boolean;
    master_timeout?: TimeSpan;
}

export interface IndicesGetResponse {
    [indexName: string]: {
        settings: Record<string, any>,
        mappings: Record<string, any>
    }
}

export function convertIndicesGetParams(
    params: IndicesGetParams,
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
                include_type_name,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if ([6, 7].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) return params;
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}
