import Ajv from 'ajv';
import * as es from 'elasticsearch';
import { Collector, DataEntity, TSError } from '@terascope/utils';
import IndexManager from './index-manager';
import * as i from './interfaces';
import { normalizeError, throwValidationError } from './error-utils';
import {
    isValidClient,
    validateIndexConfig,
} from './utils';

export default class IndexStore<T extends Object, I extends Partial<T> = T> {
    readonly client: es.Client;
    readonly config: i.IndexConfig;
    readonly manager: IndexManager;
    private _validate: ValidateFn<I|T>;
    private _indexQuery: string;
    private _interval: NodeJS.Timer|undefined;
    private readonly _collector: Collector<I>;
    private readonly _bulkMaxWait: number = 10000;
    private readonly _bulkMaxSize: number = 500;

    constructor(client: es.Client, config: i.IndexConfig) {
        if (!isValidClient(client)) {
            throw new TSError('IndexStore requires elasticsearch client', {
                fatalError: true
            });
        }

        validateIndexConfig(config);

        this.client = client;
        this.config = config;
        this.manager = new IndexManager(client);

        this._indexQuery = this.manager.formatIndexName(config);

        if (this.config.bulkMaxSize != null) {
            this._bulkMaxSize = this.config.bulkMaxSize;
        }

        if (this.config.bulkMaxWait != null) {
            this._bulkMaxWait = this.config.bulkMaxWait;
        }

        this._collector = new Collector({
            size: this._bulkMaxSize,
            wait: this._bulkMaxWait,
        });

        if (config.dataSchema != null) {
            const { allFormatters, schema, strict } = config.dataSchema;
            const ajv = new Ajv({
                useDefaults: true,
                format: allFormatters ? 'full' : 'fast'
            });
            const validate = ajv.compile(schema);
            this._validate = (input: T|I) => {
                const valid = validate(input);
                if (!valid && strict) {
                    throwValidationError(validate.errors);
                }
            };
        } else {
            this._validate = () => {};
        }

        this._toRecord = this._toRecord.bind(this);
    }

    /**
     * Safely make many requests against an index.
     *
     * This method will batch messages using the configured
     * bulk max size and wait configuration.
     */
    async bulk(doc: I) {
        this._validate(doc);
        this._collector.add(doc);

        return this._flush();
    }

    /** Count records by a given Lucene Query or Elasticsearch Query DSL */
    async count(query: string, params?: Partial<es.CountParams>): Promise<number> {
        const p = this._getParams(params, { q: query });

        return this._try(async () => {
            const { count } = await this.client.count(p);
            return count;
        });
    }

    /**
     * Index a document but will throw if doc already exists
     *
     * @returns a boolean to indicate whether the document was created
     */
    async create(doc: I, id?: string, params?: Partial<es.CreateDocumentParams>): Promise<boolean> {
        this._validate(doc);
        const defaults = { refresh: true };
        const p = this._getParams(defaults, params, { id, body: doc });

        return this._try(async () => {
            const { created } = await this.client.create(p);
            return created;
        });
    }

    /** Get a single document */
    async get(id: string, params?: Partial<es.GetParams>): Promise<DataEntity<T>> {
        const p = this._getParams(params, { id });

        return this._try(async () => {
            const result = await this.client.get<T>(p);
            return this._toRecord(result);
        });
    }

    /**
     * Connect and validate the index configuration.
    */
    async initialize() {
        await this.manager.indexSetup(this.config);

        const ms = Math.round(this._bulkMaxWait / 2);
        this._interval = setInterval(() => {
            this._flush()
                .catch((err) => {
                    console.error(err);
                });
        }, ms);
    }

    /**
     * Index a document
     */
    async index(doc: I, params?: Partial<es.IndexDocumentParams<T>>) {
        this._validate(doc);
        const defaults = { refresh: true };
        const p = this._getParams(defaults, params, {
            body: doc
        });

        return this._try(async () => {
            return this.client.index(p);
        });
    }

    /**
     * A convenience method for indexing a document with an ID
     */
    async indexWithId(doc: I, id: string, params?: Partial<es.IndexDocumentParams<T>>) {
        return this.index(doc, Object.assign({ }, params, { id }));
    }

    /** Get multiple documents at the same time */
    async mget(body: any, params?: Partial<es.MGetParams>): Promise<DataEntity<T>[]> {
        const p = this._getParams(params, { body });

        return this._try(async () => {
            const { docs } = await this.client.mget<T>(p);
            if (!docs) return [];

            return docs.map(this._toRecord);
        });
    }

    /**
     * Refreshes the current index
     */
    async refresh(params?: es.IndicesRefreshParams) {
        const p = Object.assign({
            index: this._indexQuery
        }, params);

        return this._try(() => {
            return this.client.indices.refresh(p);
        });
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

    /**
     * Shutdown, flush any pending requests and cleanup
    */
    async shutdown() {
        if (this._interval) {
            clearInterval(this._interval);
        }
        await this._flush();

        this.client.close();
    }

    /** Search with a given Lucene Query or Elasticsearch Query DSL */
    async search(params: Partial<es.SearchParams>): Promise<DataEntity<T>[]> {
        const p = this._getParams(params);
        return this._try(async () => {
            const results = await this.client.search<T>(p);
            return results.hits.hits.map(this._toRecord);
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

    private async _flush(flushAll = false) {
        const records = flushAll ? this._collector.flushAll() : this._collector.getBatch();
        if (!records) return;

        const bulkRequest: T|object[] = [];
        const indexRequest = {
            index: {
                _index: this._indexQuery,
                _type: this.config.name,
            }
        };

        for (const record of records) {
            bulkRequest.push(indexRequest);
            bulkRequest.push(record);
        }

        return this._try(() => {
            return this.client.bulk({
                body: bulkRequest,
            });
        });
    }

    private _getParams(...params: any[]) {
        return Object.assign({
            index: this._indexQuery,
            type: this.config.name
        }, ...params);
    }

    private _toRecord(result: RecordResponse<T>): DataEntity<T> {
        this._validate(result._source);
        return DataEntity.make(result._source, {
            _index: result._index,
            _type: result._type,
            _id: result._id,
            _version: result._version,
        });
    }

    private async _try<T>(fn: i.AsyncFn<T>): Promise<T> {
        // capture the stack here for better errors
        const stack = new Error('[MESSAGE]').stack;

        try {
            return await fn();
        } catch (err) {
            throw normalizeError(err, stack);
        }
    }
}

interface RecordResponse<T> {
    _index: string;
    _type: string;
    _id: string;
    _version?: number;
    _source: T;
}

type ValidateFn<T> = (input: T) => void;
