import { ElasticsearchDistribution } from '@terascope/types';
import { ExpandWildcards, SearchTypes } from './interfaces';
import { SearchResponse } from './search';
import type { DistributionMetadata } from '../interfaces';

export interface MSearchParams {
    body: (MSearchHeader | MSearchBody)[];
    ccs_minimize_roundtrips?: boolean;
    index?: string | string[];
    max_concurrent_searches?: number;
    max_concurrent_shard_requests?: number;
    pre_filter_shard_size?: number;
    rest_total_hits_as_int?: boolean;
    type?: string | string[];
    search_type?: SearchTypes;
    typed_keys?: boolean;
}

export interface MSearchHeader {
    type?: string;
    allow_no_indices?: boolean;
    expand_wildcards?: ExpandWildcards;
    ignore_unavailable?: boolean;
    index?: string | string[];
    preference?: string;
    request_cache?: boolean;
    routing?: string;
    search_type?: SearchTypes;
}

export interface MSearchBody {
    track_total_hits?: boolean | number;
    query: Record <string, any>;
    from?: number;
    size?: number;
}

export interface MSearchResponse {
    responses: IndividualResponse[];
}

interface IndividualResponse extends SearchResponse {
    status: number;
}

export function convertMSearchParams(
    params: MSearchParams,
    distributionMeta: DistributionMetadata,
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                type,
                body,
                ...parsedParams
            } = params;

            const returnParams: Record<string, any> = {
                ...parsedParams
            };

            if (body) {
                returnParams.searches = body.map((doc) => {
                    if ('type' in doc) delete doc.type;
                    return doc;
                });
            }

            return returnParams;
        }

        if (majorVersion === 7) {
            const {
                type,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 6) {
            const {
                type = '_doc',
                ccs_minimize_roundtrips,
                ...parsedParams
            } = params;

            return {
                type,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                type,
                ...parsedParams
            } = params;

            return parsedParams;
        }
    }

    throw new Error(`unsupported ${distribution} version ${version}`);
}
