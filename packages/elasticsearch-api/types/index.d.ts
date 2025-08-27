// Type definitions for elasticsearch-api
// Project: @terascope/elasticsearch-api

import { ClientParams, ClientResponse } from '@terascope/types';
import { Logger } from '@terascope/utils';
import { ClientMetadata } from '@terascope/types'

export default elasticsearchAPI;

declare function elasticsearchAPI(client: Client, logger: Logger, config?: elasticsearchAPI.Config): elasticsearchAPI.Client;

declare namespace elasticsearchAPI {
    export interface Config {
        index?: string;
        full_response?: boolean;
        connection?: string;
    }

    export interface Client {
        search: (query: ClientParams.SearchParams) => Promise<ClientResponse.SearchResponse | any[]>;
        count: (query: ClientParams.CountParams) => Promise<number>;
        get: (query: ClientParams.GetParams, fullResponse?: boolean) => Promise<any>;
        mget: (query: ClientParams.MGetParams) => Promise<any>;
        index: (query: ClientParams.IndexParams) => Promise<any>;
        indexWithId: (query: ClientParams.IndexParams) => Promise<any>;
        isAvailable: (index: string, recordType?: string) => Promise<any>;
        create: (query: ClientParams.CreateParams) => Promise<any>;
        update: (query: ClientParams.UpdateParams) => Promise<any>;
        remove: (query: ClientParams.DeleteParams) => Promise<es.DeleteDocumentResponse>;
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
        buildQuery: (opConfig: Config, msg: any) => ClientParams.SearchParams;
        indexExists: (query: ClientParams.ExistsParams) => Promise<boolean>;
        indexCreate: (query: ClientParams.IndicesCreateParams) => Promise<any>;
        indexRefresh: (query: ClientParams.IndicesRefreshParams) => Promise<any>;
        indexRecovery: (query: ClientParams.IndicesRecoveryParams) => Promise<any>;
        indexSetup: (clusterName, newIndex, migrantIndexName, mapping, recordType, clientName) => Promise<boolean>;
        verifyClient: () => boolean;
        validateGeoParameters: (opConfig: any) => any;
        /** This api is deprecated, please use getClientMetadata */
        getESVersion: () => number;
        getClientMetadata: () => ClientMetadata;
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
    export interface AnyBulkAction {
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
        _id: string | number;
        retry_on_conflict?: number;
    }
}
