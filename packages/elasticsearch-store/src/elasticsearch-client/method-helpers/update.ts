import { ElasticsearchDistribution } from '@terascope/types';
import {
    WriteResponseBase, SearchSourceFilter,
    WaitForActiveShards, Script, InlineGet
} from './interfaces';
import type { Semver } from '../interfaces';

export interface UpdateParams<TDocument = unknown, TPartialDocument = unknown> {
    id: string;
    index: string;
    type?: string;
    lang?: string;
    refresh?: boolean;
    require_alias?: boolean;
    retry_on_conflict?: number;
    routing?: string;
    source_enabled?: boolean;
    timeout?: string | number;
    wait_for_active_shards?: WaitForActiveShards;
    _source?: boolean | string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    body?: {
        detect_noop?: boolean;
        doc?: TPartialDocument;
        doc_as_upsert?: boolean;
        script?: Script;
        scripted_upsert?: boolean;
        _source?: boolean | SearchSourceFilter;
        upsert?: TDocument;
    };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UpdateResponse<TDocument = unknown> extends WriteResponseBase {
    get?: InlineGet<TDocument>;
}

export function convertUpdateParams(
    params: UpdateParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            // make sure to remove type
            const {
                type, body, ...parsedParams
            } = params;
            // ES8 does not have body
            return {
                document: body,
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
            const {
                type = '_doc', ...parsedParams
            } = params;
            // @ts-ignore type is required in v6 query
            parsedParams.type = type;
            return parsedParams;
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
