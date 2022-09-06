import { ElasticsearchDistribution } from '@terascope/types';
import { ExpandWildcards, ShardStatistics } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesValidateQueryParams {
    index?: string | string[];
    type?: string;
    allow_no_indices?: boolean;
    all_shards?: boolean;
    analyzer?: string;
    analyze_wildcard?: boolean;
    default_operator?: 'AND' | 'OR';
    df?: string;
    expand_wildcards?: ExpandWildcards;
    explain?: boolean;
    ignore_unavailable?: boolean;
    lenient?: boolean;
    query_on_query_string?: string;
    rewrite?: boolean;
    q?: string;
    body?: Record<string, any>;
}

export interface IndicesValidateQueryResponse {
    explanations?: IndicesValidateQueryIndicesValidationExplanation[];
    _shards?: ShardStatistics;
    valid: boolean;
    error?: string;
}

export interface IndicesValidateQueryIndicesValidationExplanation {
    error?: string;
    explanation?: string;
    index: string;
    valid: boolean;
}

export function convertIndicesValidateQueryParams(
    params: IndicesValidateQueryParams,
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

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8 || majorVersion === 7) return parsedParams;

        if (majorVersion === 6) {
            return {
                type,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) return parsedParams;
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
