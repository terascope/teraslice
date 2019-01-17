import Ajv from 'ajv';
import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import IndexManager from './index-manager';
import * as i from './interfaces';
import * as utils from './utils';
import { getRetryConfig } from './config';

export default class IndexStore<T extends Object, I extends Partial<T> = T> {
    readonly client: es.Client;
    readonly config: i.IndexConfig;
    readonly manager: IndexManager;

    private _validate: ValidateFn<I|T>;
    private _indexQuery: string;
    private _interval: NodeJS.Timer|undefined;

    private readonly _logger: ts.Logger;
    private readonly _collector: ts.Collector<BulkRequest<I>>;
    private readonly _bulkMaxWait: number = 10000;
    private readonly _bulkMaxSize: number = 500;
    private readonly _getEventTime: (input: T) => number;
    private readonly _getIngestTime: (input: T) => number;

    constructor(client: es.Client, config: i.IndexConfig) {
        if (!utils.isValidClient(client)) {
            throw new ts.TSError('IndexStore requires elasticsearch client', {
                fatalError: true
            });
        }

        utils.validateIndexConfig(config);

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

        const debugLoggerName = `elasticseach-store:index-store:${config.name}`;
        this._logger = config.logger || ts.debugLogger(debugLoggerName);

        this._collector = new ts.Collector({
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
                if (validate(input)) return;

                if (strict) {
                    utils.throwValidationError(validate.errors);
                } else {
                    this._logger.warn('Invalid record', input, validate.errors);
                }
            };
        } else {
            this._validate = () => {};
        }

        this._toRecord = this._toRecord.bind(this);
        this._getIngestTime = utils.getTimeByField(this.config.ingestTimeField);
        this._getEventTime = utils.getTimeByField(this.config.eventTimeField);
    }

    /**
     * Safely add a create, index, or update requests to the bulk queue
     *
     * This method will batch messages using the configured
     * bulk max size and wait configuration.
     */
    async bulk(action: 'delete', id?: string): Promise<void>;
    async bulk(action: 'index'|'create'|'update', doc?: I, id?: string): Promise<void>;
    async bulk(action: i.BulkAction, ...args: any[]) {
        const metadata: BulkRequestMetadata = {};
        metadata[action] = {
            _index: this._indexQuery,
            _type: this.config.name,
        };

        let data: BulkRequestData<I> = null;
        let id: string;

        if (action !== 'delete') {
            this._validate(args[0]);
            if (action === 'update') {
                /**
                 * TODO: Support more of the update formats
                */
                data = { doc: args[0] };
            } else {
                data = args[0];
            }
            id = args[1];
        } else {
            id = args[0];
        }

        // @ts-ignore because metadata[action] will never be undefined
        if (id) metadata[action]._id = id;

        this._collector.add({
            data,
            metadata,
        });

        return this.flush();
    }

    /** Count records by a given Lucene Query or Elasticsearch Query DSL */
    async count(query: string, params?: Partial<es.CountParams>): Promise<number> {
        const p = this._getParams(params, { q: query });

        return ts.pRetry(async () => {
            const { count } = await this.client.count(p);
            return count;
        }, getRetryConfig());
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

        return ts.pRetry(async () => {
            const { created } = await this.client.create(p);
            return created;
        }, getRetryConfig());
    }

    async flush(flushAll = false) {
        const records = flushAll ? this._collector.flushAll() : this._collector.getBatch();
        if (!records || !records.length) return;

        this._logger.debug(`Flushing ${records.length} requests to ${this._indexQuery}`);

        const bulkRequest: any[] = [];

        for (const { data, metadata } of records) {
            bulkRequest.push(metadata);
            if (data != null) bulkRequest.push(data);
        }

        await ts.pRetry(() => this._bulk(records, bulkRequest), getRetryConfig());
    }

    /** Get a single document */
    async get(id: string, params?: Partial<es.GetParams>): Promise<ts.DataEntity<T>> {
        const p = this._getParams(params, { id });

        return ts.pRetry(async () => {
            const result = await this.client.get<T>(p);
            return this._toRecord(result);
        }, getRetryConfig());
    }

    /**
     * Connect and validate the index configuration.
    */
    async initialize() {
        await this.manager.indexSetup(this.config);

        const ms = Math.round(this._bulkMaxWait / 2);

        this._interval = setInterval(() => {
            this.flush()
                .catch((err) => {
                    this._logger.error('Failure flushing in the background', err);
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

        return ts.pRetry(async () => {
            return this.client.index(p);
        }, getRetryConfig());
    }

    /**
     * A convenience method for indexing a document with an ID
     */
    async indexWithId(doc: I, id: string, params?: Partial<es.IndexDocumentParams<T>>) {
        return this.index(doc, Object.assign({ }, params, { id }));
    }

    /** Get multiple documents at the same time */
    async mget(body: any, params?: Partial<es.MGetParams>): Promise<ts.DataEntity<T>[]> {
        const p = this._getParams(params, { body });

        return ts.pRetry(async () => {
            const { docs } = await this.client.mget<T>(p);
            if (!docs) return [];

            return docs.map(this._toRecord);
        }, getRetryConfig());
    }

    /**
     * Refreshes the current index
     */
    async refresh(params?: es.IndicesRefreshParams) {
        const p = Object.assign({
            index: this._indexQuery
        }, params);

        return ts.pRetry(() => {
            return this.client.indices.refresh(p);
        }, getRetryConfig());
    }

    /**
     * Deletes a document for a given id
    */
    async remove(id: string, params?: Partial<es.DeleteDocumentParams>) {
        const p = this._getParams(params, {
            id,
        });

        await ts.pRetry(() => this.client.delete(p), getRetryConfig());
    }

    /**
     * Shutdown, flush any pending requests and cleanup
    */
    async shutdown() {
        if (this._interval) {
            clearInterval(this._interval);
        }

        if (this._collector.length) {
            this._logger.info(`Flushing ${this._collector.length} records on shutdown`);

            await this.flush(true);
        }

        this.client.close();
    }

    /** Search with a given Lucene Query or Elasticsearch Query DSL */
    async search(params: Partial<es.SearchParams>): Promise<ts.DataEntity<T>[]> {
        const p = this._getParams(params);

        return ts.pRetry(async () => {
            const results = await this.client.search<T>(p);

            // @ts-ignore because failures doesn't exist in definition
            const { failures, failed } = results._shards;

            if (failed) {
                const failureTypes = failures.flatMap((shard: any) => shard.reason.type);
                const reasons = ts.uniq(failureTypes);

                if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                    const errorReason = reasons.join(' | ');
                    this._logger.error('Not all shards returned successful, shard errors: ', errorReason);
                    throw new ts.TSError(errorReason);
                } else {
                    const error = new ts.TSError('Retryable Search Failure', {
                        retryable: true,
                    });
                    throw error;
                }
            }

            return results.hits.hits.map(this._toRecord);
        }, getRetryConfig());
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

        await ts.pRetry(() => this.client.update(p), getRetryConfig());
    }

    private async _bulk(records: BulkRequest<I>[], body: any) {
        const result: i.BulkResponse = await this.client.bulk({ body });

        const retry = utils.filterBulkRetries(records, result);

        if (retry.length) {
            this._logger.warn(`Bulk request to ${this._indexQuery} resulted in ${retry.length} errors`);

            this._logger.trace('Retrying bulk requests', retry);
            this._collector.add(retry);
        }
    }

    private _getParams(...params: any[]) {
        return Object.assign({
            index: this._indexQuery,
            type: this.config.name
        }, ...params);
    }

    private _toRecord(result: RecordResponse<T>): ts.DataEntity<T> {
        this._validate(result._source);

        return ts.DataEntity.make(result._source, {
            _key: result._id,
            _processTime: Date.now(),
            _ingestTime: this._getIngestTime(result._source),
            _eventTime: this._getEventTime(result._source),
            _index: result._index,
            _type: result._type,
            _version: result._version,
        });
    }
}

interface BulkRequest<T> {
    data: BulkRequestData<T>;
    metadata: BulkRequestMetadata;
}

type BulkRequestData<T> = T|{doc: Partial<T>}|null;

type BulkRequestMetadata = {
    [key in i.BulkAction]?: {
        _index: string;
        _type: string;
        _id?: string;
    };
};

interface RecordResponse<T> {
    _index: string;
    _type: string;
    _id: string;
    _version?: number;
    _source: T;
}

type ValidateFn<T> = (input: T) => void;
