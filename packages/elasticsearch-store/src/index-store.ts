import * as es from 'elasticsearch';
import IndexManager from './index-manager';
import { isValidClient, isValidConfig } from './utils';
import { IndexConfig } from './interfaces';

export default class IndexStore<T extends Object> {
    readonly client: es.Client;
    readonly config: IndexConfig;
    readonly manager: IndexManager;
    private _indexQuery: string;

    constructor(client: es.Client, config: IndexConfig) {
        if (!isValidClient(client)) {
            throw new Error('IndexStore requires elasticsearch client');
        }

        if (!isValidConfig(config)) {
            throw new Error('IndexStore requires a valid config');
        }

        this.client = client;
        this.config = config;
        this.manager = new IndexManager(client);
        this._indexQuery = this.manager.formatIndexName(config);
    }

    /**
     * Connect and validate the index configuration.
    */
    async initialize() {
        await this.manager.create(this.config);
    }

    /**
     * Shutdown, flush any pending requests and cleanup
    */
    async shutdown() {
        this.client.close();
    }

    /** Count records by a given Lucene Query or Elasticsearch Query DSL */
    async count(query: string, options?: Partial<es.CountParams>): Promise<number> {
        const params: es.CountParams = Object.assign({}, options, {
            q: query,
            index: this._indexQuery,
            type: this.config.index
        });
        const { count } = await this.client.count(params);
        return count;
    }

    /** Get a single document */
    async get(id: string, options?: Partial<es.GetParams>): Promise<T> {
        const params: es.GetParams = Object.assign({}, options, {
            id,
            index: this._indexQuery,
            type: this.config.index
        });
        const { _source } = await this.client.get(params);
        return _source;
    }

    /** Get multiple documents at the same time */
    async mget(query: es.MGetParams): Promise<T[]> {
        return [] as T[];
    }

    /** Search with a given Lucene Query or Elasticsearch Query DSL */
    async search(query: es.SearchParams): Promise<T[]> {
        return [] as T[];
    }

    /** Index a document */
    async index(doc: T) {
        return;
    }

    /** Index a document by id */
    async indexWithId(doc: T, id: string) {
        return;
    }

    /** Safely make many requests aginsts an index */
    async bulk(data: es.BulkIndexDocumentsParams) {
        return;
    }

    /** Index a document but will throw if doc already exists */
    async create(doc: T, id?: string) {
        return this.client.create({
            body: doc,
            id,
            refresh: true,
            index: this._indexQuery,
            type: this.config.index,
        });
    }

    /** Update a document with a given id */
    async update(doc: T, id: string) {
        return;
    }

    /** Deletes a document for a given id */
    async remove(id: string) {
        return;
    }

    /** Refresh an index */
    async refresh(params: es.IndicesRefreshParams) {
        return;
    }
}
