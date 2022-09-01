import { ElasticsearchDistribution } from '@terascope/types';
import {
    WriteResponseBase, SearchSourceFilter,
    WaitForActiveShards, Script, InlineGet
} from './interfaces';
import type { DistributionMetadata } from '../interfaces';

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
                type, body, ...parsedParams
            } = params;

            return {
                doc: body,
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

            return {
                type,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
