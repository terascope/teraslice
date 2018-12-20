import * as es from 'elasticsearch';

export interface Options {
    index: string;
    mapping: object;
    indexType: es.NameList;
}

export interface OptionsWithClient extends Options {
    client: es.Client;
}

export interface OptionsWithConfig extends Options {
    clientConfig: es.ConfigOptions;
}

export interface CoreAPI {
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
}

export interface IndexStoreAPI<T extends object> extends CoreAPI {
    constructor(params: OptionsWithClient|OptionsWithConfig): IndexStoreAPI<T>;

    /** Count records by a given Lucene Query or Elasticsearch Query DSL */
    count(query: es.CountParams): Promise<number>;
    /** Get a single document */
    get(id: string, type?: es.NameList): Promise<T>;
    /** Get multiple documents at the same time */
    mget(query: es.MGetParams): Promise<T[]>;
    /** Search with a given Lucene Query or Elasticsearch Query DSL */
    search(query: es.SearchParams): Promise<T[]>;

    /** Index a document */
    index(doc: T, type?: es.NameList): Promise<any>;
    /** Index a document by id */
    indexWithId(doc: T, id: string, type?: es.NameList): Promise<any>;
    /** Safely make many requests aginsts an index */
    bulk(data: es.BulkIndexDocumentsParams): Promise<any>;
    /** Index a document but will throw if doc already exists */
    create(doc: T, id: string, type?: es.NameList): Promise<any>;
    /**
     * Update parts of a document, body is a partial document,
     * which will be merged with the existing one
    */
    update(doc: Partial<T>, id: string, type?: es.NameList): Promise<any>;
    /** Deletes a document for a given id */
    remove(id: string, type?: es.NameList): Promise<any>;
}

/** Manage Many Indicies */
export interface IndexManagerAPI extends CoreAPI {
    constructor(client: es.Client): IndexManagerAPI;
    constructor(clientConfig: es.ConfigOptions): IndexManagerAPI;

    /** Create a template */
    createTemplate(template: any, name: string): Promise<any>;
    /** Safely update an index */
    updateTemplate(template: any, name: string): Promise<any>;

    /** Verify the index exists */
    exists(params: es.IndicesExistsParams): Promise<boolean>;
    /** Create an index */
    create(params: es.IndicesCreateParams): Promise<any>;
    /** Refresh an index */
    refresh(params: es.IndicesRefreshParams): Promise<any>;
    /** Index recovery */
    recovery(params: es.IndicesRecoveryParams): Promise<any>;
}

export interface ClusterAPI extends CoreAPI {
    constructor(client: es.Client): ClusterAPI;
    constructor(clientConfig: es.ConfigOptions): ClusterAPI;

    version(): Promise<any>;
    nodeInfo(params: es.NodesInfoParams): Promise<any>;
    nodeStats(params: es.NodesStatsParams): Promise<any>;
}
