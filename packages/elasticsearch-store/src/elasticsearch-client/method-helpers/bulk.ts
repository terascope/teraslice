import { ElasticsearchDistribution } from '@terascope/types';
import { DistributionMetadata } from '../interfaces';
import * as I from './interfaces';

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
    version_type: I.VersionType;
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
    refresh?: I.IndexRefresh;
    routing?: string;
    _source?: boolean | string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    timeout?: string | number;
    wait_for_active_shards?: I.WaitForActiveShards;
    require_alias?: boolean;
    body?: (BulkOperationContainer | BulkUpdateAction<TDocument, TPartialDocument> | TDocument)[]
}

export type SearchSourceConfig = boolean | I.SearchSourceFilter | string | string[];

export interface BulkUpdateAction<TDocument = unknown, TPartialDocument = unknown> {
    detect_noop?: boolean
    doc?: TPartialDocument
    doc_as_upsert?: boolean
    script?: I.Script
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
    error?: I.ErrorCause;
    _primary_term?: number;
    result?: string;
    _seq_no?: number;
    _shards?: I.ShardStatistics;
    _version?: number;
    forced_refresh?: boolean;
    get?: I.InlineGet<Record<string, any>>;
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
    distributionMeta: DistributionMetadata,
) {
    const { majorVersion, distribution, version } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                type,
                body,
                ...parsedParams
            } = params;

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
            const {
                type = '_doc',
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
                type, ...parsedParams
            } = params;

            return parsedParams;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
