import * as es from 'elasticsearch';
import IndexManager from './index-manager';
import { IndexConfig } from './interfaces';
import {
    isValidClient,
    isValidConfig,
    normalizeError
} from './utils';

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
    async count(query: string, params?: Partial<es.CountParams>): Promise<number> {
        const p = this._getParams(params, { q: query });
        return this._try(async () => {
            const { count } = await this.client.count(p);
            return count;
        });
    }

    /** Get a single document */
    async get(id: string, params?: Partial<es.GetParams>): Promise<T> {
        const p = this._getParams(params, { id });

        return this._try(async () => {
            return this._toRecord(await this.client.get<T>(p));
        });
    }

    /** Get multiple documents at the same time */
    async mget(body: any, params?: Partial<es.MGetParams>): Promise<T[]> {
        const p = this._getParams(params, { body });

        return this._try(async () => {
            const { docs } = await this.client.mget<T>(p);
            if (!docs) return [];

            return docs.map(this._toRecord);
        });
    }

    /** Search with a given Lucene Query or Elasticsearch Query DSL */
    async search(params: Partial<es.SearchParams>): Promise<T[]> {
        const p = this._getParams(params);
        return this._try(async () => {
            const results = await this.client.search<T>(p);
            return results.hits.hits.map(this._toRecord);
        });
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

    /**
     * Index a document but will throw if doc already exists
     *
     * @returns a boolean to indicate whether the document was created
     */
    async create(doc: T, id?: string, params?: Partial<es.CreateDocumentParams>): Promise<boolean> {
        const defaults = { refresh: true };
        const p = this._getParams(defaults, params, { id, body: doc });

        return this._try(async () => {
            const { created } = await this.client.create(p);
            return created;
        });
    }

    /** Update a document with a given id */
    async update(doc: Partial<T>, id: string, params?: Partial<es.UpdateDocumentParams>) {
        const defaults = {
            refresh: true,
            retryOnConflict: 3
        };

        const p = this._getParams(defaults, params, {
            id,
            body: { doc }
        });

        await this._try(() => this.client.update(p));
    }

    /**
     * Deletes a document for a given id
    */
    async remove(id: string, params?: Partial<es.DeleteDocumentParams>) {
        const p = this._getParams(params, {
            id,
        });

        await this._try(() => this.client.delete(p));
    }

    /** Refresh an index */
    async refresh(params: es.IndicesRefreshParams) {
        return;
    }

    private _getParams(...params: any[]) {
        return Object.assign({
            index: this._indexQuery,
            type: this.config.index
        }, ...params);
    }

    private async _try<T>(fn: AsyncFn<T>): Promise<T> {
        // capture the stack here for better errors
        const stack = new Error('[MESSAGE]').stack;

        try {
            return await fn();
        } catch (err) {
            throw normalizeError(err, stack);
        }
    }

    private _toRecord(result: { _source: T }): T {
        return result._source;
    }
}

type AsyncFn<T> = () => Promise<T>;
