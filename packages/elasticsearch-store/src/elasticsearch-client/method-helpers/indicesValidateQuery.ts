import { ElasticsearchDistribution } from '@terascope/types';
import { ExpandWildcards, ShardStatistics } from './interfaces';
import type { Semver } from '../interfaces';

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

export function convertIndicesValidateQueryPParams(
    params: IndicesValidateQueryParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            // make sure to remove type
            const {
                type, ...parsedParams
            } = params;

            return {
                ...parsedParams
            };
        }

        if (majorVersion === 7) {
            const {
                type, ...parsedParams
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
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}
