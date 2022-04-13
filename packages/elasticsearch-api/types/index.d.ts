// Type definitions for elasticsearch-api
// Project: @terascope/elasticsearch-api

import * as es from 'elasticsearch';
import { Logger } from '@terascope/utils';
import { ClientMetadata } from '@terascope/types'

export = elasticsearchAPI;

declare function elasticsearchAPI(client: Client, logger: Logger, config?: elasticsearchAPI.Config): elasticsearchAPI.Client;

declare namespace elasticsearchAPI {
    export interface Config {
        index?: string;
        full_response?: boolean;
        connection?: string;
    }

    export interface Client {
        search: (query: es.SearchParams) => Promise<es.SearchResponse | any[]>;
        count: (query: es.CountParams) => Promise<number>;
        get: (query: es.GetParams, fullResponse?: boolean) => Promise<any>;
        mget: (query: es.MGetParams) => Promise<any>;
        index: (query: es.IndexDocumentParams) => Promise<any>;
        indexWithId: (query: es.IndexDocumentParams) => Promise<any>;
        isAvailable: (index: string, recordType?: string) => Promise<any>;
        create: (query: es.CreateDocumentParams) => Promise<any>;
        update: (query: es.UpdateDocumentParams) => Promise<any>;
        remove: (query: es.DeleteDocumentParams) => Promise<es.DeleteDocumentResponse>;
        version: () => Promise<boolean>;
        putTemplate: (template: any, name: string) => Promise<any>;
        /**
         * The new and improved bulk send with proper retry support
         *
         * @returns the number of affected rows
        */
        bulkSend: (data: BulkRecord[]) => Promise<number>;
        nodeInfo: (query: any) => Promise<any>;
        nodeStats: (query: any) => Promise<any>;
        buildQuery: (opConfig: Config, msg: any) => es.SearchParams;
        indexExists: (query: es.ExistsParams) => Promise<boolean>;
        indexCreate: (query: es.IndicesCreateParams) => Promise<any>;
        indexRefresh: (query: es.IndicesRefreshParams) => Promise<any>;
        indexRecovery: (query: es.IndicesRecoveryParams) => Promise<any>;
        indexSetup: (clusterName, newIndex, migrantIndexName, mapping, recordType, clientName) => Promise<boolean>;
        verifyClient: () => boolean;
        validateGeoParameters: (opConfig: any) => any;
        /** This api is deprecated, please use getClientMetadata */
        getESVersion: () => number;
        getClientMetadata: () => ClientMetadata;
        isElasticsearch6: () => boolean
    }

    /**
     * This is used for improved bulk sending function
    */
    export interface BulkRecord {
        action: AnyBulkAction;
        data?: UpdateConfig | DataEntity;
    }

    /**
     * This is used for improved bulk sending function
    */
    export interface AnyBulkAction  {
        update?: Partial<BulkActionMetadata>;
        index?: Partial<BulkActionMetadata>;
        create?: Partial<BulkActionMetadata>;
        delete?: Partial<BulkActionMetadata>;
    }

    /**
     * This is used for improved bulk sending function
    */
    export interface BulkActionMetadata {
        _index: string;
        _type: string;
        _id: string | number;
        retry_on_conflict?: number;
    }
}
