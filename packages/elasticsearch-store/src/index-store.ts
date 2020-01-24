import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import {
    TypeConfig,
    CachedTranslator,
    createJoinQuery,
    JoinQueryResult,
    QueryAccess,
    RestrictOptions
} from 'xlucene-evaluator';
import IndexManager from './index-manager';
import * as i from './interfaces';
import * as utils from './utils';

/**
 * @todo add the ability to enable/disable refresh by default
 */
export default class IndexStore<T extends Record<string, any>> {
    readonly client: es.Client;
    readonly config: i.IndexConfig;
    readonly indexQuery: string;
    readonly manager: IndexManager;
    readonly name: string;
    refreshByDefault = true;
    protected _defaultQueryAccess: QueryAccess<T>|undefined;
    readonly xluceneTypeConfig: TypeConfig;

    readonly writeHooks = new Set<WriteHook<T>>();
    readonly readHooks = new Set<ReadHook<T>>();
    private _interval: any;

    private readonly _logger: ts.Logger;
    private readonly _collector: ts.Collector<BulkRequest<Partial<T>>>;
    private readonly _bulkMaxWait: number = 10000;
    private readonly _bulkMaxSize: number = 500;
    private readonly _getEventTime: (input: T) => number;
    private readonly _getIngestTime: (input: T) => number;
    private readonly _translator = new CachedTranslator();

    constructor(client: es.Client, config: i.IndexConfig<T>) {
        if (!utils.isValidClient(client)) {
            throw new ts.TSError('IndexStore requires elasticsearch client', {
                fatalError: true,
            });
        }

        utils.validateIndexConfig(config);

        this.client = client;
        this.config = config;
        this.name = utils.toInstanceName(this.config.name);
        this.manager = new IndexManager(client);

        this.indexQuery = this.manager.formatIndexName(config);

        if (this.config.bulk_max_size != null) {
            this._bulkMaxSize = this.config.bulk_max_size;
        }

        if (this.config.bulk_max_wait != null) {
            this._bulkMaxWait = this.config.bulk_max_wait;
        }

        const debugLoggerName = `elasticsearch-store:index-store:${config.name}`;
        this._logger = config.logger || ts.debugLogger(debugLoggerName);

        this._collector = new ts.Collector({
            size: this._bulkMaxSize,
            wait: this._bulkMaxWait,
        });

        this.xluceneTypeConfig = config.data_type.toXlucene();

        if (config.data_schema != null) {
            const validator = utils.makeDataValidator(config.data_schema, this._logger);
            this.writeHooks.add(validator);
            this.readHooks.add(validator);
        }

        this._getIngestTime = utils.getTimeByField(this.config.ingest_time_field as string);
        this._getEventTime = utils.getTimeByField(this.config.event_time_field as string);
        this._defaultQueryAccess = config.default_query_access;
    }

    /**
     * Safely add a create, index, or update requests to the bulk queue
     *
     * This method will batch messages using the configured
     * bulk max size and wait configuration.
     *
     * @todo we need to add concurrency support for sending multiple bulk requests in flight
     */
    async bulk(action: 'delete', id?: string): Promise<void>;
    async bulk(action: 'index' | 'create', doc?: Partial<T>, id?: string): Promise<void>;
    async bulk(action: 'update', doc?: Partial<T>, id?: string): Promise<void>;
    async bulk(action: i.BulkAction, ...args: any[]) {
        const metadata: BulkRequestMetadata = {};
        metadata[action] = {
            _index: this.indexQuery,
            _type: this.config.name,
        };

        let data: BulkRequestData<Partial<T>> = null;
        let id: string;

        if (action !== 'delete') {
            if (action === 'update') {
                const doc = this._runWriteHooks(args[0], false);
                /**
                 * TODO: Support more of the update formats
                 */
                data = { doc };
            } else {
                data = this._runWriteHooks(args[0], true);
            }
            // eslint-disable-next-line prefer-destructuring
            id = args[1];
        } else {
            ([id] = args);
        }

        if (id) {
            utils.validateId(id, `bulk->${action}`);
            metadata[action]!._id = id;
        }

        this._collector.add({
            data,
            metadata,
        });

        return this.flush();
    }

    /** Count records by a given Lucene Query */
    async count(
        query = '',
        options?: RestrictOptions,
        queryAccess?: QueryAccess<T>
    ): Promise<number> {
        const p = this._translateQuery(query, options, queryAccess) as es.CountParams;
        return this.countRequest(p);
    }

    /** Count records by a given Elasticsearch Query DSL */
    async countRequest(params: es.CountParams): Promise<number> {
        return ts.pRetry(async () => {
            const { count } = await this.client.count(this.getDefaultParams(params));
            return count;
        }, utils.getRetryConfig());
    }

    /**
     * Create a document with an id
     *
     * @returns the created record
     */
    async createById(id: string, doc: Partial<T>, params?: PartialParam<es.CreateDocumentParams, 'id' | 'body'>) {
        utils.validateId(id, 'createById');
        return this.create(doc, Object.assign({}, params, { id }));
    }

    /**
     * Create a document but will throw if doc already exists
     *
     * @returns the created record
     */
    async create(doc: Partial<T>, params?: PartialParam<es.CreateDocumentParams, 'body'>): Promise<T> {
        const record = this._runWriteHooks(doc, true);
        const defaults = { refresh: this.refreshByDefault };
        const p = this.getDefaultParams(defaults, params, { body: record });

        const result = await ts.pRetry(
            () => this.client.create(p) as any,
            utils.getRetryConfig()
        );
        result._source = record;
        return this._toRecord(result);
    }

    async flush(flushAll = false) {
        const records = flushAll ? this._collector.flushAll() : this._collector.getBatch();
        if (!records || !records.length) return;

        this._logger.debug(`Flushing ${records.length} requests to ${this.indexQuery}`);

        const bulkRequest: any[] = [];

        for (const { data, metadata } of records) {
            bulkRequest.push(metadata);
            if (data != null) bulkRequest.push(data);
        }

        await ts.pRetry(() => this._bulk(records, bulkRequest), utils.getRetryConfig());
    }

    /** Get a single document */
    async get(id: string, params?: PartialParam<es.GetParams>): Promise<T> {
        utils.validateId(id, 'get');
        const p = this.getDefaultParams(params, { id });

        const result = await ts.pRetry(
            () => this.client.get(p) as Promise<RecordResponse<T>>,
            utils.getRetryConfig()
        );
        return this._toRecord(result);
    }

    /**
     * Connect and validate the index configuration.
     */
    async initialize() {
        await this.manager.indexSetup(this.config);

        const ms = Math.round(this._bulkMaxWait / 2);

        this._interval = setInterval(() => {
            this.flush().catch((err) => {
                this._logger.error(err, 'Failure flushing in the background');
            });
        }, ms);
    }

    /**
     * Index a document
     */
    async index(doc: T | Partial<T>, params?: PartialParam<es.IndexDocumentParams<T>, 'body'>): Promise<T> {
        const body = this._runWriteHooks(doc, true);

        const defaults = { refresh: this.refreshByDefault };
        const p = this.getDefaultParams(defaults, params, {
            body,
        });

        const result = await ts.pRetry(() => this.client.index(p), utils.getRetryConfig());
        result._source = doc;
        return this._toRecord(result);
    }

    /**
     * A convenience method for indexing a document with an ID
     */
    async indexById(id: string, doc: T | Partial<T>, params?: PartialParam<es.IndexDocumentParams<T>, 'index' | 'type' | 'id'>) {
        utils.validateId(id, 'indexById');
        return this.index(doc, Object.assign({}, params, { id }));
    }

    /** Get multiple documents at the same time */
    async mget(body: any, params?: PartialParam<es.MGetParams>): Promise<T[]> {
        const p = this.getDefaultParams(params, { body });

        const docs = await ts.pRetry(async () => {
            const result = await this.client.mget<T>(p);
            return result.docs || [];
        }, utils.getRetryConfig());

        return this._toRecords(docs, true);
    }

    /** @see IndexManager#migrateIndex */
    migrateIndex(options: i.MigrateIndexStoreOptions) {
        return this.manager.migrateIndex({ ...options, config: this.config });
    }

    /**
     * Refreshes the current index
     */
    async refresh(params?: PartialParam<es.IndicesRefreshParams>) {
        const p = Object.assign(
            {
                index: this.indexQuery,
            },
            params
        );

        await ts.pRetry(() => this.client.indices.refresh(p), utils.getRetryConfig());
    }

    /**
     * Deletes a document for a given id
     */
    async deleteById(id: string, params?: PartialParam<es.DeleteDocumentParams>) {
        utils.validateId(id, 'deleteById');
        const p = this.getDefaultParams(
            {
                refresh: this.refreshByDefault,
            },
            params,
            {
                id,
            }
        );

        await ts.pRetry(() => this.client.delete(p), utils.getRetryConfig());
    }

    /**
     * Shutdown, flush any pending requests and cleanup
     */
    async shutdown() {
        if (this._interval != null) {
            clearInterval(this._interval);
        }

        if (this._collector.length) {
            this._logger.info(`Flushing ${this._collector.length} records on shutdown`);

            await this.flush(true);
        }
    }

    /** Update a document with a given id */
    async update(id: string, body: UpdateBody<T>, params?: PartialParam<es.UpdateDocumentParams, 'body' | 'id'>): Promise<void> {
        utils.validateId(id, 'update');
        const defaults = {
            refresh: this.refreshByDefault,
            retryOnConflict: 3,
        };

        const _body = body as any;
        if (_body.doc) {
            const doc = this._runWriteHooks(_body.doc, false);
            _body.doc = doc;
        }

        const p = this.getDefaultParams(defaults, params, {
            id,
            body: _body
        });

        await ts.pRetry(() => this.client.update(p), utils.getRetryConfig());
    }

    /** Safely apply updates to a document by applying the latest changes */
    async updatePartial(
        id: string,
        applyChanges: ApplyPartialUpdates<T>,
        retriesOnConlfict = 3
    ): Promise<T> {
        utils.validateId('updatePartial', id);
        try {
            const existing = await this.get(id) as any;
            const params: any = {};
            if (ts.DataEntity.isDataEntity(existing)) {
                const esVersion = utils.getESVersion(this.client);
                if (esVersion >= 7) {
                    params.if_seq_no = existing.getMetadata('_seq_no');
                    params.if_primary_term = existing.getMetadata('_primary_term');
                } else {
                    params.version = existing.getMetadata('_version');
                }
            }
            return await this.indexById(
                id,
                await applyChanges(existing),
                params
            );
        } catch (error) {
            // if there is a version conflict
            if (error.statusCode === 409 && error.message.includes('version conflict')) {
                return this.updatePartial(id, applyChanges, retriesOnConlfict - 1);
            }
            throw error;
        }
    }

    getDefaultParams(...params: any[]) {
        return Object.assign(
            {
                index: this.indexQuery,
                type: this.config.name,
            },
            ...params
        );
    }

    async countBy(
        fields: AnyInput<T>,
        joinBy?: JoinBy,
        options?: RestrictOptions,
        queryAccess?: QueryAccess<T>,
    ): Promise<number> {
        const { query, variables } = this.createJoinQuery(fields, joinBy, options?.variables);
        return this.count(query, { variables }, queryAccess);
    }

    async exists(
        id: string[] | string,
        options?: RestrictOptions,
        queryAccess?: QueryAccess<T>
    ): Promise<boolean> {
        const ids = utils.validateIds(id, 'exists');
        if (!ids.length) return true;

        const count = await this.countBy({
            [this.config.id_field!]: ids,
        } as AnyInput<T>, 'AND', options, queryAccess);

        return count === ids.length;
    }

    async findBy(
        fields: AnyInput<T>,
        joinBy?: JoinBy,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ) {
        const { query, variables } = this.createJoinQuery(fields, joinBy, options?.variables);

        const results = await this.search(
            query,
            {
                ...options,
                size: 1,
                variables
            },
            queryAccess,
            true
        );

        const record = ts.getFirst(results);
        if (record == null) {
            let errQuery = query;
            for (const [key, value] of Object.entries(variables)) {
                errQuery = errQuery.replace(`$${key}`, value);
            }
            throw new ts.TSError(`Unable to find ${this.name} by ${errQuery}`, {
                statusCode: 404,
            });
        }

        return record;
    }

    async findAllBy(
        fields: AnyInput<T>,
        joinBy?: JoinBy,
        options?: i.FindOptions<T>,
        queryAccess?: QueryAccess<T>
    ): Promise<T[]> {
        const { query, variables } = this.createJoinQuery(fields, joinBy, options?.variables);

        return this.search(
            query,
            { variables, size: 10000, ...options },
            queryAccess,
            false
        );
    }

    async findById(
        id: string,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ): Promise<T> {
        utils.validateId(id, 'findById');
        const fields = {
            [this.config.id_field!]: id
        } as AnyInput<T>;
        return this.findBy(fields, 'AND', options, queryAccess);
    }

    async findAndApply(
        updates: Partial<T> | undefined,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ): Promise<Partial<T>> {
        if (ts.isEmpty(updates) || !ts.isPlainObject(updates)) {
            throw new ts.TSError(`Invalid input for ${this.name}`, {
                statusCode: 422,
            });
        }

        const id = updates![this.config.id_field as any];
        if (!id) return { ...updates };

        const current = await this.findById(id, options, queryAccess);
        return { ...current, ...updates };
    }

    async findAll(
        ids: string[] | string | undefined,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ): Promise<T[]> {
        const _ids = utils.validateIds(ids, 'exists');
        if (!_ids.length) return [];

        const { query, variables } = this.createJoinQuery({
            [this.config.id_field!]: _ids
        } as AnyInput<T>, 'AND', { variables: options?.variables });

        const result = await this.search(
            query,
            {
                ...options,
                size: _ids.length,
                variables
            },
            queryAccess,
            false
        );

        if (result.length !== _ids.length) {
            const foundIds = result.map((doc) => doc[this.config.id_field as string]);
            const notFoundIds = _ids.filter((id) => !foundIds.includes(id));
            throw new ts.TSError(`Unable to find ${this.name}'s ${notFoundIds.join(', ')}`, {
                statusCode: 404,
            });
        }

        // maintain sort order
        return _ids.map((id) => result.find((doc) => doc[this.config.id_field as string] === id)!);
    }

    /** Search with a given Lucene Query */
    async search(
        q = '',
        options: i.FindOptions<T> = {},
        queryAccess?: QueryAccess<T>,
        critical?: boolean
    ): Promise<T[]> {
        const params: Partial<es.SearchParams> = {
            size: options.size,
            sort: options.sort,
            from: options.from,
            _sourceExclude: options.excludes as string[],
            _sourceInclude: options.includes as string[],
        };

        let searchParams: Partial<es.SearchParams>;
        const _queryAccess = (queryAccess || this._defaultQueryAccess);
        if (_queryAccess) {
            searchParams = await _queryAccess.restrictSearchQuery(q, {
                params,
                elasticsearch_version: utils.getESVersion(this.client),
                variables: options.variables
            });
        } else {
            searchParams = Object.assign(
                {},
                params,
                this._translateQuery(q, { variables: options.variables })
            );
        }

        return this.searchRequest(searchParams, critical);
    }

    /** Search using the underyling Elasticsearch Query DSL */
    async searchRequest(
        params: PartialParam<SearchParams<T>>,
        critical?: boolean
    ): Promise<T[]> {
        const esVersion = utils.getESVersion(this.client);
        if (esVersion >= 7) {
            const p: any = params;
            if (p._sourceExclude) {
                p._sourceExcludes = p._sourceExclude.slice();
                delete p._sourceExclude;
            }
            if (p._sourceInclude) {
                p._sourceIncludes = p._sourceInclude.slice();
                delete p._sourceInclude;
            }
        }

        const results = await ts.pRetry(async () => this.client.search<T>(
            this.getDefaultParams(
                {
                    sort: this.config.default_sort,
                },
                params
            )
        ), utils.getRetryConfig());

        const { failures, failed } = results._shards as any;

        if (failed) {
            const failureTypes = failures.flatMap((shard: any) => shard.reason.type);
            const reasons = ts.uniq(failureTypes);

            if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                const errorReason = reasons.join(' | ');
                throw new ts.TSError(errorReason, {
                    reason: 'Not all shards returned successful, shard errors: ',
                });
            } else {
                throw new ts.TSError('Retryable Search Failure', {
                    retryable: true,
                });
            }
        }

        return this._toRecords(results.hits.hits, critical);
    }

    createJoinQuery(fields: AnyInput<T>, joinBy: JoinBy = 'AND', variables = {}): JoinQueryResult {
        const result = createJoinQuery(fields, {
            joinBy,
            typeConfig: this.xluceneTypeConfig,
            variables
        });
        if (result) return result;

        return { query: `${ts.getFirstKey(fields)}: "__undefined__"`, variables: {} };
    }

    /**
     * Append values from an array on a record.
     * Use with caution, this may not work in all cases.
    */
    async appendToArray(
        id: string,
        field: keyof T,
        values: string[] | string
    ): Promise<void> {
        utils.validateId(id, 'appendToArray');
        const valueArray = values && ts.uniq(ts.castArray(values)).filter((v) => !!v);
        if (!valueArray || !valueArray.length) return;

        await this.update(id, {
            script: {
                source: `
                    for(int i = 0; i < params.values.length; i++) {
                        if (!ctx._source["${field}"].contains(params.values[i])) {
                            ctx._source["${field}"].add(params.values[i])
                        }
                    }
                `,
                lang: 'painless',
                params: {
                    values: valueArray,
                },
            },
        });
    }

    /**
     * Remove values from an array on a record.
     * Use with caution, this may not work in all cases.
    */
    async removeFromArray(
        id: string,
        field: keyof T,
        values: string[] | string
    ): Promise<void> {
        utils.validateId(id, 'removeFromArray');
        const valueArray = values && ts.uniq(ts.castArray(values)).filter((v) => !!v);
        if (!valueArray || !valueArray.length) return;

        try {
            await this.update(id, {
                script: {
                    source: `
                        for(int i = 0; i < params.values.length; i++) {
                            if (ctx._source["${field}"].contains(params.values[i])) {
                                int itemIndex = ctx._source["${field}"].indexOf(params.values[i]);
                                ctx._source["${field}"].remove(itemIndex)
                            }
                        }
                    `,
                    lang: 'painless',
                    params: {
                        values: valueArray,
                    },
                },
            });
        } catch (err) {
            if (err && err.statusCode === 404) {
                return;
            }
            throw err;
        }
    }

    private async _bulk(records: BulkRequest<Partial<T>>[], body: any) {
        const result: i.BulkResponse = await ts.pRetry(
            () => this.client.bulk({ body }),
            { ...utils.getRetryConfig(), retries: 0 }
        );

        const retry = utils.filterBulkRetries(records, result);

        if (retry.length) {
            this._logger.warn(`Bulk request to ${this.indexQuery} resulted in ${retry.length} errors`);

            this._logger.trace('Retrying bulk requests', retry);
            this._collector.add(retry);
        }
    }

    protected _toRecord(result: RecordResponse<T>, critical = true): T {
        const doc = this._runReadHooks(this._makeDataEntity(result), critical);
        if (!doc && critical) {
            throw new ts.TSError('Record Missing', {
                statusCode: 410
            });
        }
        return doc as T;
    }

    protected _toRecords(results: RecordResponse<T>[], critical = false): T[] {
        return results.map((result) => this._toRecord(result, critical)).filter(Boolean);
    }

    private _makeDataEntity(result: RecordResponse<T>): T {
        return ts.DataEntity.make<T>(result._source, {
            _key: result._id,
            _processTime: Date.now(),
            _ingestTime: this._getIngestTime(result._source),
            _eventTime: this._getEventTime(result._source),
            _index: result._index,
            _type: result._type,
            _version: result._version,
            _seq_no: result._seq_no,
            _primary_term: result._primary_term
        }) as any;
    }

    /**
     * Run additional validation after retrieving the record from elasticsearch
    */
    private _runReadHooks(doc: T, critical: boolean): T|false {
        let _doc = doc;
        for (const hook of this.readHooks) {
            const result = hook(_doc, critical);
            if (result == null) {
                throw new Error('Expected read hook to return a doc or false');
            }
            if (result === false) return false;
            _doc = result;
        }
        return _doc;
    }

    /**
     * Run additional validation before updating or creating the record
    */
    private _runWriteHooks(doc: T|Partial<T>, critical: boolean): T {
        let _doc = doc;
        for (const hook of this.writeHooks) {
            const result = hook(_doc, critical);
            if (result == null) {
                throw new Error('Expected write hook to return a doc or to throw');
            }
            _doc = result;
        }
        return _doc as T;
    }

    private _translateQuery(
        q: string,
        options?: RestrictOptions,
        queryAccess?: QueryAccess<T>
    ) {
        const _queryAccess = (queryAccess || this._defaultQueryAccess);
        const query = _queryAccess
            ? _queryAccess.restrict(q, {
                variables: options?.variables
            })
            : q;

        const translator = this._translator.make(query, {
            type_config: this.xluceneTypeConfig,
            logger: this._logger,
            variables: options?.variables
        });

        return {
            q: undefined,
            body: translator.toElasticsearchDSL(),
        };
    }
}

interface BulkRequest<T> {
    data: BulkRequestData<T>;
    metadata: BulkRequestMetadata;
}

type BulkRequestData<T> = T | { doc: Partial<T> } | null;

type BulkRequestMetadata = {
    [key in i.BulkAction]?: {
        _index: string;
        _type: string;
        _id?: string;
    }
};

interface RecordResponse<T> {
    _index: string;
    _type: string;
    _id: string;
    _version?: number;
    _seq_no?: number;
    _primary_term?: number;
    _source: T;
}

type ReservedParams = 'index' | 'type';
type PartialParam<T, E = any> = {
    [K in Exclude<keyof T, E extends keyof T ? ReservedParams & E : ReservedParams>]?: T[K]
};

type SearchParams<T> = ts.Overwrite<
es.SearchParams,
{
    q: never;
    body: never;
    _source?: (keyof T)[];
    _sourceInclude?: (keyof T)[];
    _sourceExclude?: (keyof T)[];
}
>;

type ApplyPartialUpdates<T> = (existing: T) => Promise<T> | T;

export type AnyInput<T> = { [P in keyof T]?: T[P] | any };
export type JoinBy = 'AND' | 'OR';
export type UpdateBody<T> = ({ doc: Partial<T> })|({ script: any });

export type WriteHook<T> = (doc: Partial<T>, critical: boolean) => T|Partial<T>;
export type ReadHook<T> = (doc: T, critical: boolean) => T|false;
