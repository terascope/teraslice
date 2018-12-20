import * as es from 'elasticsearch';
import { IndexConfig } from './interfaces';

export default class IndexStore<T extends Object> {
    readonly client: es.Client;
    readonly config: IndexConfig;

    constructor(client: es.Client, config: IndexConfig) {
        this.client = client;
        this.config = config;
    }

    /**
     * Connect and validate the index configuration.
    */
    async initialize() {
        return;
    }

    /**
     * Shutdown, flush any pending requests and cleanup
    */
    async shutdown() {
        return;
    }

    /** Count records by a given Lucene Query or Elasticsearch Query DSL */
    async count(query: es.CountParams): Promise<number> {
        return 0;
    }

    /** Get a single document */
    async get(id: string, type?: es.NameList): Promise<T> {
        return {} as T;
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
    async index(doc: T, type?: es.NameList) {

    }

    /** Index a document by id */
    async indexWithId(doc: T, id: string, type?: es.NameList) {

    }

    /** Safely make many requests aginsts an index */
    async bulk(data: es.BulkIndexDocumentsParams) {
        return;
    }

    /** Index a document but will throw if doc already exists */
    async create(doc: T, id: string, type?: es.NameList) {
        return;
    }

    /** Update a document with a given id */
    async update(doc: T, id: string, type?: es.NameList) {
        return;
    }

    /** Deletes a document for a given id */
    async remove(id: string, type?: es.NameList) {
        return;
    }
}
