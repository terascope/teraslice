import { ElasticsearchDistribution } from '@terascope/types';
import {
    IndexRefresh, WaitForActiveShards, InlineGet,
    VersionType, ShardStatistics, ErrorCause,
    Script, SearchSourceFilter
} from './interfaces';
import type { Semver } from '../interfaces';

export type BulkCreateOperation = BulkOperation

export type BulkCreateResponseItem = BulkResponseItemBase

export type BulkDeleteOperation = BulkOperation

export type BulkDeleteResponseItem = BulkResponseItemBase

export type BulkIndexOperation = BulkOperation

export type BulkIndexResponseItem = BulkResponseItemBase

export interface BulkOperation {
    _id: string;
    _index: string;
    retry_on_conflict: number;
    routing: string;
    version: number;
    version_type: VersionType;
}

export interface BulkOperationContainer {
    index?: BulkIndexOperation;
    create?: BulkCreateOperation;
    update?: BulkUpdateOperation;
    delete?: BulkDeleteOperation;
}

export interface BulkParams<TDocument = unknown, TPartialDocument = unknown> {
    index?: string;
    type?: string;
    refresh?: IndexRefresh;
    routing?: string;
    _source?: boolean | string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    timeout?: string | number;
    wait_for_active_shards?: WaitForActiveShards;
    require_alias?: boolean;
    body?: (BulkOperationContainer | BulkUpdateAction<TDocument, TPartialDocument> | TDocument)[]
}

export type SearchSourceConfig = boolean | SearchSourceFilter | string | string[];

export interface BulkUpdateAction<TDocument = unknown, TPartialDocument = unknown> {
    detect_noop?: boolean
    doc?: TPartialDocument
    doc_as_upsert?: boolean
    script?: Script
    scripted_upsert?: boolean
    _source?: SearchSourceConfig
    upsert?: TDocument
}

export interface BulkResponse {
    errors: boolean;
    items: BulkResponseItemContainer[];
    took: number;
    ingest_took?: number;
}

export interface BulkResponseItemBase {
    _id?: string | null;
    _index: string;
    status: number;
    error?: ErrorCause;
    _primary_term?: number;
    result?: string;
    _seq_no?: number;
    _shards?: ShardStatistics;
    _version?: number;
    forced_refresh?: boolean;
    get?: InlineGet<Record<string, any>>;
}

export interface BulkResponseItemContainer {
    index?: BulkIndexResponseItem;
    create?: BulkCreateResponseItem;
    update?: BulkUpdateResponseItem;
    delete?: BulkDeleteResponseItem;
}

export type BulkUpdateOperation = BulkOperation

export type BulkUpdateResponseItem = BulkResponseItemBase

export function convertBulkParams(
    params: BulkParams,
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
            // ES8 does not have body, it has operations
            return {
                operations: body,
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
