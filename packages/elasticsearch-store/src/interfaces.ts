export interface StoreOptions {
    client: any;
    index: string;
    mapping: object;
    indexType: string;
}

export interface CoreAPI {
    initialize(): Promise<any>;
    shutdown(): Promise<any>;
}

export interface IndexStoreAPI<T extends object> extends CoreAPI {
    /** Safely make many requests aginsts an index */
    bulk(data: BulkRequest): Promise<any>;
    /** Count records by a given Lucene Query or Elasticsearch Query DSL */
    count(query: string|QueryDSL): Promise<number>;
    /** Index a document but will throw if doc already exists */
    create(doc: T, id: string, type?: string): Promise<any>;
    /** Get a single document */
    get(id: string, type?: string): Promise<T>;
    /** Index a document */
    index(doc: T, type?: string): Promise<any>;
    /** Index a document by id */
    indexWithId(doc: T, id: string, type?: string): Promise<any>;
    /** Get multiple documents at the same time */
    mget(query: any): Promise<any>;
    /** Deletes a document for a given id */
    remove(id: string, type?: string): Promise<any>;
    /** Search with a given Lucene Query or Elasticsearch Query DSL */
    search(query: string|QueryDSL): Promise<T[]>;
    /**
     * Update parts of a document, body is a partial document,
     * which will be merged with the existing one
    */
    update(doc: Partial<T>, id: string, type?: string): Promise<any>;
    validateGeoParameters(geo: any): boolean;
}

// TODO
export interface BulkRequest {
}

// TODO
export interface QueryDSL {
}

/** Manage Many Indicies */
export interface IndexManagerAPI extends CoreAPI {
    /** Add a template to the index */
    addTemplate(template: any, name: string): Promise<any>;
    /** Verify the index exists */
    exists(query: any): Promise<boolean>;
    /** Create an index */
    create(query: any): Promise<any>;
    /** Refresh an index */
    refresh(query: any): Promise<any>;
    /** Index recovery */
    recovery(query: any): Promise<any>;
    /** Index Setup API */
    setup(query: any): Promise<any>;
}

export interface ClusterAPI extends CoreAPI {
    version(): Promise<any>;
    nodeInfo(): Promise<any>;
    nodeStats(): Promise<any>;
}
