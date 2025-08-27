import ms from 'ms';
import {
    TSError, parseError, isTest, pDelay,
    pRetry, logError, pWhile, isString, getTypeOf,
    get, random, isInteger, Logger
} from '@terascope/utils';
import elasticsearchApi, { Client, BulkRecord } from '@terascope/elasticsearch-api';
import { getClient, Context } from '@terascope/job-components';
import { ClientParams } from '@terascope/types';
import { makeLogger } from '../../workers/helpers/terafoundation.js';
import { timeseriesIndex } from '../../utils/date_utils.js';
import analyticsSchema from './mappings/analytics.js';
import assetSchema from './mappings/asset.js';
import executionSchema from './mappings/ex.js';
import jobsSchema from './mappings/job.js';
import stateSchema from './mappings/state.js';

function validateId(recordId: string, recordType: string) {
    if (!recordId || !isString(recordId)) {
        throw new TSError(`Invalid ${recordType} id given ${getTypeOf(recordId)}`, {
            statusCode: 422
        });
    }
}

function validateIdAndRecord(
    recordId: string,
    record: Record<string, any>,
    recordType: string,
    idField: string
) {
    validateId(recordId, recordType);

    const id = record[idField];
    if (id && id !== recordId) {
        throw new TSError(`${recordType}.${idField} doesn't match request id`, {
            statusCode: 406
        });
    }
}
// TODO: fix types here
function _getTimeout(timeout: number | string | undefined) {
    if (isInteger(timeout)) {
        // don't allow a timeout of less than 1 second
        if (timeout <= 1000) return undefined;
        return ms(timeout);
    }
    if (isString(timeout)) {
        return timeout;
    }
    return undefined;
}

export interface TerasliceESStorageConfig {
    context: Context;
    indexName: string;
    recordType: string;
    idField: string;
    storageName: string;
    bulkSize?: number;
    fullResponse?: boolean;
    logRecord?: boolean;
    forceRefresh?: boolean;
    logger?: Logger;
}

export interface TerasliceStorageOptions {
    bulkSize: number;
    fullResponse: boolean;
    logRecord: boolean;
    forceRefresh: boolean;
}

// TODO: type this better
export class TerasliceElasticsearchStorage {
    readonly context: Context;
    logger: Logger;
    readonly recordType: string;
    // TODO: should this be here?
    readonly defaultIndexName: string;
    readonly storageName: string;
    private flushInterval!: NodeJS.Timeout;
    private isShuttingDown = false;
    // flag to know if already in a bulk call
    private savingBulk = false;
    // Buffer to build up bulk requests. TODO: fix type
    private bulkQueue: any[] = [];
    private readonly idField: string;
    readonly options!: TerasliceStorageOptions;
    readonly mapping: Record<string, any>;
    api!: Client;

    constructor(backendConfig: TerasliceESStorageConfig) {
        const {
            context, indexName, recordType,
            idField, storageName, bulkSize = 1000,
            fullResponse = false, logRecord = true,
            forceRefresh = true, logger
        } = backendConfig;

        this.context = context;
        this.storageName = storageName;
        this.logger = logger ?? makeLogger(context, 'elasticsearch_backend', { storageName });
        this.recordType = recordType;
        if (recordType === 'analytics') {
            this.mapping = analyticsSchema;
        } else if (recordType === 'asset') {
            this.mapping = assetSchema;
        } else if (recordType === 'ex') {
            this.mapping = executionSchema;
        } else if (recordType === 'job') {
            this.mapping = jobsSchema;
        } else if (recordType === 'state') {
            this.mapping = stateSchema;
        } else {
            throw new Error(`Could not find mapping for recordType: ${recordType}`);
        }

        const config = this.context.sysconfig.teraslice;
        const indexSettings = get(config, ['index_settings', this.storageName], {
            number_of_shards: 5,
            number_of_replicas: 1,
        });

        this.mapping.settings = {
            'index.number_of_shards': indexSettings.number_of_shards,
            'index.number_of_replicas': indexSettings.number_of_replicas,
        };

        this.defaultIndexName = indexName;
        this.idField = idField;
        this.options = {
            bulkSize,
            fullResponse,
            logRecord,
            forceRefresh
        };
    }

    async initialize() {
        const config = this.context.sysconfig.teraslice;
        const isMultiIndex = this.defaultIndexName[this.defaultIndexName.length - 1] === '*';
        let newIndex = this.defaultIndexName;

        if (isMultiIndex) {
            // @ts-expect-error TODO: fix this
            const storeType: 'analytics' | 'state' = this.defaultIndexName.match(/__(.*)\*/)[1];
            const timeseriesFormat = config.index_rollover_frequency[storeType];
            const nameSize = this.defaultIndexName.length - 1;
            newIndex = timeseriesIndex(
                timeseriesFormat,
                this.defaultIndexName.slice(0, nameSize)
            ).index;
        }

        const clientName = JSON.stringify({
            connection: config.state.connection,
            index: this.defaultIndexName,
        });

        const connectionConfig = Object.assign({}, config.state) as Record<string, any>;
        if (connectionConfig.connection_cache == null) {
            connectionConfig.connection_cache = true;
        }

        const { connection } = config.state;

        const options = {
            full_response: !!this.options.fullResponse,
            connection,
        };

        await pWhile(async () => {
            try {
                const client = await getClient(this.context, connectionConfig, 'elasticsearch-next');

                this.api = elasticsearchApi(client, this.logger, options);
                await this._createIndex(newIndex);
                await this.api.isAvailable(newIndex, this.recordType);

                return true;
            } catch (err) {
                const error = new TSError(err, {
                    reason: `Failure initializing ${this.recordType} index: ${this.defaultIndexName}`,
                });

                if (error.statusCode >= 400 && error.statusCode < 500) {
                    throw error;
                }

                logError(this.logger, error, `Failed attempt connecting to elasticsearch: ${clientName} (will retry)`);

                await pDelay(isTest ? 0 : random(2000, 4000));

                return false;
            }
        });

        // Periodically flush the bulkQueue so we don't end up with cached data lingering.
        this.flushInterval = setInterval(() => {
            // TODO: this might be undefined
            this._flush().catch((err) => {
                logError(this.logger, err, 'background flush failure');
                return null;
            });
            // stager the interval to avoid collisions
        }, random(9000, 11000));
    }

    async get(
        recordId: string,
        index = this.defaultIndexName,
        fields?: string | string[]
    ) {
        validateId(recordId, this.recordType);
        this.logger.trace(`getting record id: ${recordId}`);

        const query: ClientParams.GetParams = {
            index,
            id: recordId,
        };

        if (fields) {
            query._source_includes = fields;
        }

        return this.api.get(query);
    }

    async search(
        query: string | Record<string, any>,
        from = 0,
        size = 10000,
        sort?: string,
        fields?: string | string[],
        index = this.defaultIndexName
    ) {
        if (from != null && !isInteger(from)) {
            throw new Error(`from parameter must be a integer, got ${from}`);
        }
        if (size != null && !isInteger(size)) {
            throw new Error(`size parameter must be a integer, got ${size}`);
        }
        if (sort != null && !isString(sort)) {
            throw new Error(`sort parameter must be a string, got ${sort}`);
        }

        const esQuery: ClientParams.SearchParams = {
            index,
            from,
            size,
            sort,
        };

        if (typeof query === 'string') {
            esQuery.q = query;
        } else {
            esQuery.body = query;
        }

        if (fields) {
            esQuery._source_includes = fields;
        }

        return this.api.search(esQuery);
    }

    /*
     * index saves a record to elasticsearch allowing automatic
     * ID creation
     */
    async index(record: Record<string, any>, indexArg = this.defaultIndexName) {
        this.logger.trace('indexing record', this.options.logRecord ? record : undefined);
        const query: ClientParams.IndexParams = {
            index: indexArg,
            body: record,
            refresh: this.options.forceRefresh,
        };

        return this.api.index(query);
    }

    /*
     * index saves a record to elasticsearch with a specified ID.
     * If the document is already there it will be replaced.
     */
    async indexWithId(
        recordId: string,
        record: Record<string, any>,
        index = this.defaultIndexName,
        timeout?: string | number | undefined
    ) {
        validateIdAndRecord(recordId, record, this.recordType, this.idField);

        this.logger.trace(`indexWithId call with id: ${recordId}, record`, this.options.logRecord ? record : null);

        const query: ClientParams.IndexParams = {
            index,
            id: recordId,
            body: record,
            refresh: this.options.forceRefresh,
            timeout: _getTimeout(timeout)
        };

        return this.api.indexWithId(query);
    }

    /*
     * Create saves a record to elasticsearch under the provided id.
     * If the record already exists it will not be inserted.
     */
    async create(record: Record<string, any>, index = this.defaultIndexName) {
        this.logger.trace('creating record', this.options.logRecord ? record : null);

        const query: ClientParams.CreateParams = {
            index,
            id: record[this.idField],
            body: record,
            refresh: this.options.forceRefresh,
        };

        return this.api.create(query);
    }

    async count(
        query: string | Record<string, any>,
        from?: number,
        sort?: string,
        index = this.defaultIndexName
    ) {
        if (from != null && !isInteger(from)) {
            throw new Error(`from parameter must be a integer, got ${from}`);
        }
        if (sort != null && !isString(sort)) {
            throw new Error(`sort parameter must be a string, got ${sort}`);
        }

        // TODO: check from
        const esQuery: ClientParams.CountParams = {
            index,
            // @ts-expect-error
            from,
            sort,
        };

        if (isString(query)) {
            esQuery.q = query;
        } else {
            esQuery.body = query;
        }

        return this.api.count(esQuery);
    }

    async update(
        recordId: string,
        updateSpec: Record<string, any>,
        index = this.defaultIndexName
    ) {
        validateIdAndRecord(recordId, updateSpec, this.recordType, this.idField);

        this.logger.trace(`updating record ${recordId}, `, this.options.logRecord ? updateSpec : null);

        const query: ClientParams.UpdateParams = {
            index,
            id: recordId,
            body: {
                doc: updateSpec,
            },
            refresh: this.options.forceRefresh,
            // TODO: check this retry
            retry_on_conflict: 3,
        };

        return this.api.update(query);
    }

    async updatePartial(
        recordId: string,
        applyChanges: (doc: Record<string, any>) => Promise<Record<string, any>>,
        index = this.defaultIndexName
    ): Promise<Record<string, any>> {
        if (typeof applyChanges !== 'function') {
            throw new Error('Update Partial expected a applyChanges function');
        }

        validateId(recordId, this.recordType);

        const getParams: ClientParams.GetParams = {
            index,
            id: recordId,
        };

        const existing = await pRetry(() => this.api.get(getParams, true), {
            matches: ['no_shard_available_action_exception'],
            delay: 1000,
            retries: 10,
            backoff: 5
        });

        const doc = await applyChanges(Object.assign({}, existing._source));

        this.logger.trace(`updating partial record ${recordId}, `, this.options.logRecord ? doc : null);

        validateIdAndRecord(recordId, doc, this.recordType, this.idField);

        const query: ClientParams.IndexParams = {
            index,
            id: recordId,
            body: doc,
            refresh: this.options.forceRefresh,
        };

        query.if_seq_no = existing._seq_no;
        query.if_primary_term = existing._primary_term;

        try {
            await this.api.indexWithId(query);
            return doc;
        } catch (err) {
            // if there is a version conflict
            if (err.statusCode === 409 && err.message.includes('version conflict')) {
                this.logger.debug({ error: err }, `version conflict when updating "${recordId}" (${this.recordType})`);
                return this.updatePartial(recordId, applyChanges, index);
            }

            throw new TSError(err);
        }
    }

    async remove(recordId: string, index = this.defaultIndexName) {
        validateId(recordId, this.recordType);

        this.logger.trace(`removing record ${recordId}`);

        const query: ClientParams.DeleteParams = {
            index,
            id: recordId,
            refresh: this.options.forceRefresh,
        };

        return this.api.remove(query);
    }

    async bulk(record: Record<string, any>, type = 'index', index = this.defaultIndexName) {
        if (this.isShuttingDown) {
            throw new TSError('Unable to send bulk record after shutdown', {
                context: {
                    recordType: this.recordType,
                    record,
                },
            });
        }

        const action = {
            [type]: { _index: index }
        };

        this.bulkQueue.push({
            action,
            data: type === 'delete' ? undefined : record
        });

        // We only flush once enough records have accumulated for it to make sense.
        if (this.bulkQueue.length >= this.options.bulkSize) {
            this.logger.trace(`flushing bulk queue ${this.bulkQueue.length}`);
            return this._flush();
        }

        // Bulk saving is a background operation so we don't have
        // anything meaningful to return.
        return Promise.resolve(true);
    }

    private _destroy(err?: Error) {
        this.bulkQueue = [];
        this.isShuttingDown = true;

        if (err) {
            throw err;
        }

        return true;
    }

    async shutdown(forceShutdown = false) {
        const startTime = Date.now();
        this.logger.trace(`shutdown store, took ${ms(Date.now() - startTime)}`);

        clearInterval(this.flushInterval);

        if (forceShutdown !== true) {
            return this._flush(true);
        }

        const destroy = this._destroy.bind(this);
        const timeout = this.context.sysconfig.teraslice.shutdown_timeout;

        this.logger.trace(`attempting to shutdown, will destroy in ${timeout}`);
        setTimeout(destroy, timeout).unref();

        try {
            await this._flush(true);
            this._destroy();
        } catch (err) {
            this._destroy(err);
        }
    }

    async bulkSend(bulkRequest: BulkRecord[]) {
        return this.api.bulkSend(bulkRequest);
    }

    private async _flush(shuttingDown = false) {
        if (!this.bulkQueue.length) return;
        if (!shuttingDown && this.savingBulk) return;

        this.savingBulk = true;

        const bulkRequest = this.bulkQueue.slice();
        this.bulkQueue = [];

        try {
            const recordCount = await this.bulkSend(bulkRequest);
            const extraMsg = shuttingDown ? ', on shutdown' : '';
            this.logger.debug(`flushed ${recordCount}${extraMsg} records to index ${this.defaultIndexName}`);
        } finally {
            this.savingBulk = false;
        }
    }

    async sendTemplate(mapping: any) {
        if (mapping.template) {
            const clusterName = this.context.sysconfig.teraslice.name;
            const name = `${clusterName}_${this.recordType}_template`;
            // setting template name to reflect current teraslice instance name to help prevent
            // conflicts with differing versions of teraslice with same elastic db
            if (mapping.template) {
                if (!mapping.template.match(clusterName)) {
                    mapping.template = `${clusterName}${mapping.template}`;
                }
            }

            return this.putTemplate(mapping, name);
        }

        return Promise.resolve(true);
    }

    private async _createIndex(index = this.defaultIndexName) {
        // @ts-expect-error TODO: check type missing id
        const existQuery: ClientParams.ExistsParams = { index };
        const exists = await this.api.indexExists(existQuery);

        if (!exists) {
            // Make sure the index exists before we do anything else.
            const createQuery: ClientParams.IndicesCreateParams = {
                index,
                body: this.mapping,
            };

            try {
                await this.sendTemplate(this.mapping);
                return await this.api.indexCreate(createQuery);
            } catch (err) {
                // It's not really an error if it's just that the index is already there
                if (parseError(err).includes('already_exists_exception')) {
                    return true;
                }

                const error = new TSError(err, {
                    reason: `Could not create index: ${index}`,
                });
                throw error;
            }
        }

        // Index already exists. nothing to do.
        return true;
    }

    async refresh(index = this.defaultIndexName) {
        const query: ClientParams.IndicesRefreshParams = { index };
        return this.api.indexRefresh(query);
    }

    // TODO: fix type here
    async putTemplate(template: any, name: string) {
        return this.api.putTemplate(template, name);
    }

    verifyClient() {
        if (this.isShuttingDown) return false;
        return this.api.verifyClient();
    }

    async waitForClient() {
        if (this.api.verifyClient()) return;

        await pWhile(async () => {
            if (this.isShuttingDown) throw new Error('Elasticsearch store is shutdown');
            if (this.api.verifyClient()) return true;
            await pDelay(100);
            return false;
        });
    }
}
