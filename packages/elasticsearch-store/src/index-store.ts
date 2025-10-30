import {
    TSError, debugLogger, pRetry,
    type Logger, isString, isInteger, isFunction,
    getFirst, isPlainObject, isEmpty,
    get, uniq, getFirstKey, castArray,
    Collector, DataEntity
} from '@terascope/core-utils';
import {
    xLuceneTypeConfig, ClientMetadata, ESTypes,
    ClientParams, ClientResponse, ElasticsearchDistribution,
} from '@terascope/types';
import { CachedTranslator, QueryAccess, RestrictOptions } from 'xlucene-translator';
import { toXluceneQuery, xLuceneQueryResult } from '@terascope/data-mate';
import { type Client, isValidClient } from '@terascope/opensearch-client';
import { IndexManager } from './index-manager.js';
import * as i from './interfaces.js';
import {
    validateId, validateIds, getRetryConfig, validateIndexConfig,
    toInstanceName, makeDataValidator, getTimeByField, filterBulkRetries
} from './utils/index.js';

const OPENSEARCH = ElasticsearchDistribution.opensearch;
/**
 * A single index elasticsearch-store with some specific requirements around
 * the index name, and record data
 */
export class IndexStore<T extends Record<string, any>> {
    readonly client: Client;
    readonly config: i.IndexConfig<T>;
    readonly manager: IndexManager;
    readonly name: string;
    refreshByDefault = true;
    readonly clientMetadata: ClientMetadata;
    protected _defaultQueryAccess: QueryAccess<T> | undefined;
    readonly xLuceneTypeConfig: xLuceneTypeConfig;

    readonly writeHooks = new Set<WriteHook<T>>();
    readonly readHooks = new Set<ReadHook<T>>();
    private _interval: any;

    private readonly _logger: Logger;
    private readonly _collector: Collector<BulkRequest<Partial<T>>>;
    private readonly _bulkMaxWait: number = 10000;
    private readonly _bulkMaxSize: number = 500;
    private readonly _getEventTime: (input: T) => number;
    private readonly _getIngestTime: (input: T) => number;
    private readonly _translator = new CachedTranslator();
    private readonly isOpensearch: boolean;

    constructor(client: Client, config: i.IndexConfig<T>) {
        if (!isValidClient(client)) {
            throw new TSError('IndexStore requires elasticsearch client', {
                fatalError: true,
            });
        }

        validateIndexConfig(config);

        this.client = client;
        this.config = config;
        this.name = toInstanceName(this.config.name);
        this.manager = new IndexManager(client, config.enable_index_mutations);
        this.clientMetadata = this.manager.clientMetadata;
        this.isOpensearch = this.clientMetadata.distribution === OPENSEARCH;
        if (this.config.bulk_max_size != null) {
            this._bulkMaxSize = this.config.bulk_max_size;
        }

        if (this.config.bulk_max_wait != null) {
            this._bulkMaxWait = this.config.bulk_max_wait;
        }

        const debugLoggerName = `elasticsearch-store:index-store:${config.name}`;
        this._logger = config.logger || debugLogger(debugLoggerName);

        this._collector = new Collector({
            size: this._bulkMaxSize,
            wait: this._bulkMaxWait,
        });

        this.xLuceneTypeConfig = config.data_type.toXlucene();

        if (config.data_schema != null) {
            const validator = makeDataValidator(config.data_schema, this._logger);
            this.writeHooks.add(validator);
            const validateOnRead = config.data_schema.validate_on_read ?? true;
            if (validateOnRead) {
                this.readHooks.add(validator);
            }
        }

        this._getIngestTime = getTimeByField(this.config.ingest_time_field as string);
        this._getEventTime = getTimeByField(this.config.event_time_field as string);
        this._defaultQueryAccess = config.default_query_access;
    }

    /**
     * The most current indexed used to write to
    */
    get writeIndex(): string {
        return this.manager.formatIndexName(this.config, false);
    }

    /**
     * The index typically used for searching across all of the open indices
    */
    get searchIndex(): string {
        return this.manager.formatIndexName(this.config);
    }

    /**
     * Safely add a create, index, or update requests to the bulk queue
     *
     * This method will batch messages using the configured
     * bulk max size and wait configuration.
     *
     * Because using the upsert-with-script api since that can break depending on the
     * underlying elasticsearch version and/or client library
     *
     * @param onBulkQueueConflict is used to detect and replace existing items in
     *                            the bulk queue with the same name and action
     *
     * @todo we need to add concurrency support for sending multiple bulk requests in flight
     *       and making sure they finish before shutdown
     */
    async bulk(action: 'delete', id: string,): Promise<void>;
    async bulk(action: 'index' | 'create', doc: Partial<T>, id?: string, retryOnConflict?: number, onBulkQueueConflict?: OnBulkConflictFn<T>): Promise<void>;
    async bulk(action: 'update', doc: Partial<T>, id?: string, retryOnConflict?: number, onBulkQueueConflict?: OnBulkConflictFn<T>): Promise<void>;
    async bulk(action: 'upsert-with-script', script: UpsertWithScript<T>, id?: string, retryOnConflict?: number, onBulkQueueConflict?: OnBulkConflictFn<T>): Promise<void>;
    async bulk(_action: i.BulkAction | 'upsert-with-script', ...args: any[]): Promise<void> {
        let retry_on_conflict: number | undefined;
        let id: string | undefined;
        let onBulkQueueConflict: OnBulkConflictFn<T> | undefined;

        const last = args[args.length - 1];
        const secondToLast = args[args.length - 2];
        const thirdToLast = args[args.length - 3];

        if (
            (isString(thirdToLast) || thirdToLast == null)
            && (isInteger(secondToLast) || secondToLast == null)
            && isFunction(last)
        ) {
            id = thirdToLast;
            retry_on_conflict = secondToLast;
            onBulkQueueConflict = last;
        } else if ((isString(secondToLast) || secondToLast == null) && isInteger(last)) {
            id = secondToLast;
            retry_on_conflict = last;
        } else if (isString(last)) {
            id = last;
        }

        const action: i.BulkAction = _action === 'upsert-with-script' ? 'update' : _action;
        const metadata: BulkRequestMetadata = {};

        metadata[action] = {
            _index: this.writeIndex,
            retry_on_conflict
        };

        let data: BulkRequestData<Partial<T>> = null;

        if (_action !== 'delete') {
            if (_action === 'update') {
                const doc = this._runWriteHooks(args[0], false);
                data = { doc };
            } else if (_action === 'upsert-with-script') {
                data = {
                    ...args[0],
                    upsert: this._runWriteHooks(args[0].upsert, false)
                };
            } else {
                data = this._runWriteHooks(args[0], true);
            }
        }

        if (id) {
            validateId(id, `bulk->${action}`);
            metadata[action]!._id = id;
        }

        if (onBulkQueueConflict && id != null) {
            const { queue } = this._collector;

            for (let index = 0; index < queue.length; index++) {
                const item = queue[index];
                if (item.metadata[action]?._id === id) {
                    const newItem = onBulkQueueConflict(item, {
                        data,
                        metadata,
                    });
                    if (newItem != null) {
                        queue[index] = newItem;
                        // we can stop early
                        return this.flush();
                    }
                }
            }
        }

        this._collector.add({
            data,
            metadata,
        });

        return this.flush();
    }

    /** Count records by a given Lucene Query */
    async count(
        query?: string,
        options?: RestrictOptions,
        queryAccess?: QueryAccess<T>
    ): Promise<number> {
        // TODO: check type here around index
        const p = this._translateQuery(
            query ?? '', options, queryAccess
        ) as unknown as ClientParams.CountParams;

        return this.countRequest(p);
    }

    /** Count records by a given Elasticsearch Query DSL */
    async countRequest(params: ClientParams.CountParams): Promise<number> {
        return pRetry(async () => {
            const { count } = await this.client.count(
                this.getDefaultParams<ClientParams.CountParams>(
                    this.searchIndex,
                    params
                )
            );

            return count;
        }, getRetryConfig());
    }

    /**
     * Create a document with an id
     *
     * @returns the created record
     */
    async createById(
        id: string, doc: Partial<T>, params?: PartialParam<ClientParams.CreateParams<T>, 'id' | 'body'>
    ): Promise<T> {
        validateId(id, 'createById');
        return this.create(doc, Object.assign({}, params, { id }));
    }

    /**
     * Create a document but will throw if doc already exists
     *
     * @returns the created record
     */
    async create(
        doc: Partial<T>,
        params?: PartialParam<ClientParams.CreateParams<T>, 'body'>
    ): Promise<T> {
        const record = this._runWriteHooks(doc, true);
        const defaults = { refresh: this.refreshByDefault };

        const p = this.getDefaultParams<ClientParams.CreateParams<T>>(
            this.writeIndex, defaults, params, { body: record }
        );

        const result = await pRetry(
            async () => this.client.create(p),
            getRetryConfig()
        );

        const finalRecord = {
            ...result,
            _source: record
        } as unknown as ESTypes.SearchResult<T>;

        return this._toRecord(finalRecord);
    }

    async flush(flushAll = false): Promise<void> {
        const records = flushAll ? this._collector.flushAll() : this._collector.getBatch();
        if (!records || !records.length) return;

        this._logger.debug(`Flushing ${records.length} requests to ${this.writeIndex}`);

        const bulkRequest: any[] = [];

        for (const { data, metadata } of records) {
            bulkRequest.push(metadata);
            if (data != null) bulkRequest.push(data);
        }

        await pRetry(() => this._bulk(records, bulkRequest), getRetryConfig());
    }

    /** Get a single document */
    async get(id: string, params?: PartialParam<ClientParams.GetParams>): Promise<T> {
        validateId(id, 'get');
        const p = this.getDefaultParams(this.writeIndex, params, { id });

        const result = await pRetry(
            async () => this.client.get(
                p as ClientParams.GetParams
            ),
            getRetryConfig()
        ) as ESTypes.SearchResult<T>;

        return this._toRecord(result);
    }

    /**
     * Connect and validate the index configuration.
     */
    async initialize(): Promise<void> {
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
    async index(doc: T | Partial<T>, params?: PartialParam<ClientParams.IndexParams<T>, 'body'>): Promise<T> {
        const body = this._runWriteHooks(doc, true);

        const defaults = { refresh: this.refreshByDefault };
        const p = this.getDefaultParams<ClientParams.IndexParams<T>>(
            this.writeIndex,
            defaults,
            params,
            { body }
        );

        const result = await pRetry(
            async () => this.client.index(p),
            getRetryConfig()) as unknown as ESTypes.SearchResult<T>;

        // @ts-expect-error
        result._source = doc;

        return this._toRecord(result);
    }

    /**
     * A convenience method for indexing a document with an ID
     */
    async indexById(
        id: string,
        doc: T | Partial<T>,
        params?: PartialParam<ClientParams.IndexParams<T>, 'index' | 'type' | 'id'>
    ): Promise<T> {
        validateId(id, 'indexById');

        return this.index(doc, Object.assign({}, params, { id }));
    }

    /** Get multiple documents at the same time */
    async mget(
        body: ESTypes.MGetBody,
        params?: PartialParam<ClientParams.MGetParams>
    ): Promise<T[]> {
        const p = this.getDefaultParams <ClientParams.MGetParams>(
            this.writeIndex, params, { body }
        );

        const docs = await pRetry(async () => {
            const result = await this.client.mget(p);
            return result.docs || [];
        }, getRetryConfig()) as ESTypes.SearchResult<T>[];

        return this._toRecords(docs, true);
    }

    /** @see IndexManager#migrateIndex */
    migrateIndex(options: i.MigrateIndexStoreOptions): Promise<any> {
        return this.manager.migrateIndex<T>({ ...options, config: this.config });
    }

    /**
     * Refreshes the current index
     */
    async refresh(params?: PartialParam<ClientParams.IndicesRefreshParams>): Promise<void> {
        const p = Object.assign(
            {
                index: this.writeIndex,
            },
            params
        );

        await pRetry(() => this.client.indices.refresh(p), getRetryConfig());
    }

    /**
     * Deletes a document for a given id
     */
    async deleteById(
        id: string, params?: PartialParam<ClientParams.DeleteParams>
    ): Promise<void> {
        validateId(id, 'deleteById');
        const p = this.getDefaultParams<ClientParams.DeleteParams>(
            this.writeIndex,
            {
                refresh: this.refreshByDefault,
            },
            params,
            {
                id,
            }
        );

        await pRetry(() => this.client.delete(p), getRetryConfig());
    }

    /**
     * Shutdown, flush any pending requests and cleanup
     */
    async shutdown(): Promise<void> {
        if (this._interval != null) {
            clearInterval(this._interval);
        }

        if (this._collector.length) {
            this._logger.info(`Flushing ${this._collector.length} records on shutdown`);

            await this.flush(true);
        }
    }

    /** Update a document with a given id */
    async update(
        id: string,
        body: UpdateBody<T>,
        params?: PartialParam<ClientParams.UpdateParams, 'body' | 'id'>
    ): Promise<void> {
        validateId(id, 'update');

        const defaults: Partial<ClientParams.UpdateParams> = {
            refresh: true,
            retry_on_conflict: 3
        };

        const _body = body;

        if ('doc' in _body) {
            const doc = this._runWriteHooks(_body.doc, false);
            _body.doc = doc;
        }

        const p = this.getDefaultParams<ClientParams.UpdateParams>(
            this.writeIndex,
            defaults,
            params,
            { id, body: _body }
        );

        await pRetry(
            async () => this.client.update(p),
            getRetryConfig()
        );
    }

    /** Safely apply updates to a document by applying the latest changes */
    async updatePartial(
        id: string,
        applyChanges: ApplyPartialUpdates<T>,
        retriesOnConflict = 3
    ): Promise<T> {
        validateId('updatePartial', id);

        try {
            const existing = await this.get(id);
            const params: Partial<ClientParams.IndexParams<T>> = {};

            if (DataEntity.isDataEntity(existing)) {
                params.if_seq_no = existing.getMetadata('_seq_no');
                params.if_primary_term = existing.getMetadata('_primary_term');
            }

            return this.indexById(
                id,
                await applyChanges(existing),
                params
            );
        } catch (error) {
            // if there is a version conflict
            if (error.statusCode === 409 && error.message.includes('version conflict')) {
                return this.updatePartial(id, applyChanges, retriesOnConflict - 1);
            }

            throw error;
        }
    }

    getDefaultParams<P extends Record<string, any> = { index: string; [prop: string]: any }>(
        index: string,
        ...params: ((Partial<P> & Record<string, any>) | undefined)[]
    ): P {
        return Object.assign(
            { index },
            ...params
        ) as P;
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
        const ids = validateIds(id, 'exists');
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
    ): Promise<T> {
        const { query, variables } = this.createJoinQuery(fields, joinBy, options?.variables);

        const { results } = await this.search(
            query,
            {
                ...options,
                size: 1,
                variables
            },
            queryAccess,
            true
        );

        const record = getFirst(results);

        if (record == null) {
            let errQuery = query;
            for (const [key, value] of Object.entries(variables)) {
                errQuery = errQuery.replace(`$${key}`, value);
            }
            throw new TSError(`Unable to find ${this.name} by ${errQuery}`, {
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

        const { results } = await this.search(
            query,
            { variables, size: 10000, ...options },
            queryAccess,
            false
        );

        return results;
    }

    async findById(
        id: string,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ): Promise<T> {
        validateId(id, 'findById');

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
        if (isEmpty(updates) || !isPlainObject(updates)) {
            throw new TSError(`Invalid input for ${this.name}`, {
                statusCode: 422,
            });
        }

        if (!this.config.id_field) return { ...updates };
        const id = updates[this.config.id_field!];
        if (!id) return { ...updates };

        const current = await this.findById(id, options, queryAccess);
        return { ...current, ...updates };
    }

    async findAll(
        ids: string[] | string | undefined,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ): Promise<T[]> {
        const _ids = validateIds(ids, 'exists');
        if (!_ids.length) return [];

        const { query, variables } = this.createJoinQuery({
            [this.config.id_field!]: _ids
        } as AnyInput<T>, 'AND', { variables: options?.variables });

        const { results: result } = await this.search(
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
            throw new TSError(`Unable to find ${this.name}'s ${notFoundIds.join(', ')}`, {
                statusCode: 404,
            });
        }

        // maintain sort order
        return _ids.map((id) => result.find((doc) => doc[this.config.id_field as string] === id)!);
    }

    /** Search with a given Lucene Query */
    async search(
        q?: string,
        options?: i.FindOptions<T>,
        queryAccess?: QueryAccess<T>,
        critical?: boolean
    ): Promise<i.SearchResult<T>> {
        const params: Partial<ClientParams.SearchParams> = {
            size: options?.size,
            sort: options?.sort,
            from: options?.from,
            _source_excludes: options?.excludes as string[],
            _source_includes: options?.includes as string[],
        };

        let searchParams: Partial<ClientParams.SearchParams>;
        const _queryAccess = (queryAccess || this._defaultQueryAccess);

        if (_queryAccess) {
            searchParams = await _queryAccess.restrictSearchQuery(q ?? '', {
                params,
                variables: options?.variables,
                ...this.clientMetadata
            });
        } else {
            searchParams = Object.assign(
                {},
                params,
                this._translateQuery(q ?? '', { variables: options?.variables })
            );
        }

        return this.searchRequest(searchParams, critical);
    }

    /** Search using the underlying Elasticsearch Query DSL */
    async searchRequest(
        params: PartialParam<ClientParams.SearchParams>,
        critical?: boolean
    ): Promise<i.SearchResult<T>> {
        const response = await this._search({
            sort: this.config.default_sort,
            ...params,
        });

        const total = get(response, 'hits.total.value', get(response, 'hits.total', 0)) as number;
        const results = this._toRecords(response.hits.hits, critical);

        return {
            _total: total,
            _fetched: results.length,
            results,
        };
    }

    /** Run an aggregation using an Elasticsearch Query DSL */
    async aggregate<A = ESTypes.SearchAggregations>(
        query: Record<string, any>,
        params?: PartialParam<ClientParams.SearchParams>,
    ): Promise<A> {
        const response = await this._search({
            ...params,
            size: 0,
            body: query
        });

        return response.aggregations as unknown as A;
    }

    /**
     * A small abstraction on client.search with retry support
    */
    protected async _search(
        params: PartialParam<ClientParams.SearchParams>,
    ): Promise<ClientResponse.SearchResponse<T>> {
        const response = await pRetry(
            async () => this.client.search<T>(
                this.getDefaultParams<ClientParams.SearchParams>(
                    this.searchIndex,
                    params,
                )
            ),
            getRetryConfig()
        );

        const { failures, failed } = response._shards as any;

        if (failed) {
            const failureTypes = failures.flatMap((shard: any) => shard.reason.type);
            const reasons = uniq(failureTypes);

            if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                const errorReason = reasons.join(' | ');
                throw new TSError(errorReason, {
                    reason: 'Not all shards returned successful, shard errors: ',
                });
            } else {
                throw new TSError('Retryable Search Failure', {
                    retryable: true,
                });
            }
        }

        return response;
    }

    createJoinQuery(fields: AnyInput<T>, joinBy: JoinBy = 'AND', variables = {}): xLuceneQueryResult {
        const result = toXluceneQuery(fields, {
            joinBy,
            typeConfig: this.xLuceneTypeConfig,
            variables
        });
        if (result) return result;

        return { query: `${String(getFirstKey(fields))}: "__undefined__"`, variables: {} };
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
        validateId(id, 'appendToArray');
        const valueArray = values && uniq(castArray(values)).filter((v) => !!v);
        if (!valueArray || !valueArray.length) return;

        await this.update(id, {
            script: {
                source: `
                    for(int i = 0; i < params.values.length; i++) {
                        if (!ctx._source["${String(field)}"].contains(params.values[i])) {
                            ctx._source["${String(field)}"].add(params.values[i])
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
        validateId(id, 'removeFromArray');
        const valueArray = values && uniq(castArray(values)).filter((v) => !!v);
        if (!valueArray || !valueArray.length) return;
        const fieldStr = String(field);

        try {
            await this.update(id, {
                script: {
                    source: `
                        for(int i = 0; i < params.values.length; i++) {
                            if (ctx._source["${fieldStr}"].contains(params.values[i])) {
                                int itemIndex = ctx._source["${fieldStr}"].indexOf(params.values[i]);
                                ctx._source["${fieldStr}"].remove(itemIndex)
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
        const result: i.BulkResponse = await pRetry(
            () => this.client.bulk({ body }),
            { ...getRetryConfig(), retries: 0 }
        );

        const retry = filterBulkRetries(records, result);

        if (retry.length) {
            this._logger.warn(`Bulk request to ${this.writeIndex} resulted in ${retry.length} errors`);

            this._logger.trace('Retrying bulk requests', retry);
            this._collector.add(retry);
        }
    }

    protected _toRecord(result: ESTypes.SearchResult<T>, critical = true): T {
        const doc = this._runReadHooks(this._makeDataEntity(result), critical);

        if (!doc && critical) {
            throw new TSError('Record Missing', {
                statusCode: 410
            });
        }

        return doc as T;
    }

    protected _toRecords(results: ESTypes.SearchResult<T>[], critical = false): T[] {
        return results.map((result) => this._toRecord(result, critical)).filter(Boolean);
    }

    private _makeDataEntity(
        result: ESTypes.SearchResult<T>
    ): T {
        return DataEntity.make<T>(result._source as any, {
            _key: result._id,
            _processTime: Date.now(),
            _ingestTime: this._getIngestTime(result._source as any),
            _eventTime: this._getEventTime(result._source as any),
            _index: result._index,
            _version: result._version,
            _seq_no: result._seq_no,
            _primary_term: result._primary_term
        }) as any;
    }

    /**
     * Run additional validation after retrieving the record from elasticsearch
    */
    private _runReadHooks(doc: T, critical: boolean): T | false {
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
    private _runWriteHooks(doc: T | Partial<T>, critical: boolean): T {
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
            ? _queryAccess.restrict(q)
            : q;

        const translator = this._translator.make(query, {
            type_config: this.xLuceneTypeConfig,
            logger: this._logger,
            variables: options?.variables
        });

        return {
            q: undefined,
            body: translator.toElasticsearchDSL(),
        };
    }
}

export interface BulkRequest<T> {
    data: BulkRequestData<T>;
    metadata: BulkRequestMetadata;
}

export type UpsertWithScript<T> = {
    script: {
        source: string;
        lang: 'painless';
        params: Record<string, unknown>;
    };
    upsert: Partial<T>;
};

export type BulkRequestData<T> = T | { doc: Partial<T> } | UpsertWithScript<T> | null;

export type BulkRequestMetadata = {
    [key in i.BulkAction]?: {
        _index: string;
        _id?: string;
        retry_on_conflict?: number;
    }
};
export type OnBulkConflictFn<T> = (
    existingItem: BulkRequest<Partial<T>>,
    newItem: BulkRequest<Partial<T>>
) => BulkRequest<Partial<T>> | null;

type ReservedParams = 'index';
// TODO: this type is wrong and is overly permissive, allows for any value to be set
type PartialParam<T, E = any> = {
    [K in Exclude<keyof T, E extends keyof T ? ReservedParams & E : ReservedParams>]?: T[K]
};

type ApplyPartialUpdates<T> = (existing: T) => Promise<T> | T;

export type AnyInput<T> = { [P in keyof T]?: T[P] | any };
export type JoinBy = 'AND' | 'OR';
export type UpdateBody<T> = ({ doc: Partial<T> })|({ script: any });

export type WriteHook<T> = (doc: Partial<T>, critical: boolean) => T | Partial<T>;
export type ReadHook<T> = (doc: T, critical: boolean) => T | false;
