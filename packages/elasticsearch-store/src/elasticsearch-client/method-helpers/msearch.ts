import { ElasticsearchDistribution } from '@terascope/types';
import { ExpandWildcards, SearchTypes } from './interfaces';
import { SearchResponse } from './search';
import type { Semver } from '../interfaces';

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
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    const parsedParams: Record<string, any> = params;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            if (params.body) {
                parsedParams.searches = params.body.map((doc) => {
                    if ('type' in doc) delete doc.type;
                    return doc;
                });
            }

            delete parsedParams.type;
            delete parsedParams.body;

            return parsedParams;
        }

        if (majorVersion === 7) {
            return parsedParams;
        }

        if (majorVersion === 6) {
            delete params.ccs_minimize_roundtrips;

            return parsedParams;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return parsedParams;
        }
    }

    throw new Error(`unsupported ${distribution} version ${version}`);
}
