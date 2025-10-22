import {
    TSError, includes, getTypeOf,
    makeISODate, Logger
} from '@terascope/core-utils';
import { Context, RecoveryCleanupType } from '@terascope/job-components';
import { v4 as uuid } from 'uuid';
import { JobConfig, ExecutionConfig } from '@terascope/types';
import { makeLogger } from '../workers/helpers/terafoundation.js';
import { TerasliceElasticsearchStorage, TerasliceESStorageConfig } from './backends/elasticsearch_store.js';

const INIT_STATUS = ['pending', 'scheduling', 'initializing'];
const RUNNING_STATUS = ['recovering', 'running', 'failing', 'paused', 'stopping'];
const TERMINAL_STATUS = ['completed', 'stopped', 'rejected', 'failed', 'terminated'];

const VALID_STATUS = INIT_STATUS.concat(RUNNING_STATUS).concat(TERMINAL_STATUS);

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
export class ExecutionStorage {
    private backend: TerasliceElasticsearchStorage;
    readonly jobType: string;
    logger: Logger;

    constructor(context: Context) {
        const logger = makeLogger(context, 'ex_storage');
        const config = context.sysconfig.teraslice;
        const jobType = 'ex';
        const indexName = `${config.name}__ex`;

        const backendConfig: TerasliceESStorageConfig = {
            context,
            indexName,
            recordType: 'ex',
            idField: 'ex_id',
            fullResponse: false,
            logRecord: false,
            storageName: 'execution',
            logger
        };
        this.jobType = jobType;
        this.logger = logger;
        this.backend = new TerasliceElasticsearchStorage(backendConfig);

        if (context.apis.executionContext) {
            context.apis.executionContext.registerMetadataFns(
                { get: this.getMetadata.bind(this), update: this.updateMetadata.bind(this) }
            );
        }
    }

    async initialize() {
        await this.backend.initialize();
        this.logger.info('execution storage initialized');
    }

    async get(exId: string): Promise<ExecutionConfig> {
        const results = await this.backend.get(exId);
        return results as ExecutionConfig;
    }

    // encompasses all executions in either initialization or running statuses
    async getActiveExecution(exId: string): Promise<ExecutionConfig> {
        const str = this.getTerminalStatuses().map((state) => ` _status:${state} `)
            .join('OR');
        const query = `ex_id:"${exId}" NOT (${str.trim()})`;
        const executions = await this.backend.search(query, undefined, 1, '_created:desc') as any[];

        if (!executions.length) {
            throw new TSError(`no active execution context was found for ex_id: ${exId}`, {
                statusCode: 404
            });
        }

        return executions[0] as ExecutionConfig;
    }

    async search(
        query: string | Record<string, any>,
        from?: number,
        size?: number,
        sort?: string,
        fields?: string | string[]
    ): Promise<ExecutionConfig[]> {
        const results = await this.backend.search(query, from, size, sort, fields);
        return results as ExecutionConfig[];
    }

    async create(record: JobConfig | ExecutionConfig, status = 'pending'): Promise<ExecutionConfig> {
        if (!this._isValidStatus(status)) {
            throw new Error(`Unknown status "${status}" on execution create`);
        }
        if (!record.job_id) {
            throw new Error('Missing job_id on execution create');
        }

        const date = makeISODate();
        const doc = Object.assign({}, record, {
            ex_id: uuid(),
            metadata: {},
            _status: status,
            _context: this.jobType,
            _created: date,
            _updated: date,
            _has_errors: false,
            _slicer_stats: {},
            _failureReason: ''
        });
        // @ts-expect-error
        delete doc.slicer_port;
        // @ts-expect-error
        delete doc.slicer_hostname;

        try {
            await this.backend.create(doc);
        } catch (err) {
            throw new TSError(err, {
                reason: 'Failure to create execution context'
            });
        }

        return doc as unknown as ExecutionConfig;
    }

    async updatePartial(
        exId: string,
        applyChanges: (doc: Record<string, any>) => Promise<Record<string, any>>
    ): Promise<ExecutionConfig> {
        return this.backend.updatePartial(exId, applyChanges) as unknown as ExecutionConfig;
    }

    /**
     * @typedef ExErrorMetadata
     * @property _has_errors {boolean}
     * @property _failureReason {string}
     * @property _slicer_stats {import(
     *  '../workers/execution-controller/execution-analytics.js'
     * ).ExecutionStats}
     */

    /**
     * Format the execution error stats, primarly used for updating the
     * status.
     *
     * If no error message is passed, it will reset the _has_errors and _failureReason.
     * If execution stats is provided it will set the _slicer_stats
     *
     * @param stats {import(
     *  '../workers/execution-controller/execution-analytics.js'
     * ).ExecutionStats=}
     * @param errMsg {string=}
     * @return {ExErrorMetadata}
    */
    // TODO: type out stats
    executionMetaData(stats: any, errMsg?: string) {
        const errMetadata = {
            _has_errors: false,
            _failureReason: ''
        };
        const statsMetadata: Record<string, any> = {};

        if (errMsg) {
            errMetadata._has_errors = true;
            errMetadata._failureReason = errMsg;
        }

        if (stats) {
            statsMetadata._slicer_stats = Object.assign({}, stats);
        }

        return Object.assign({}, errMetadata, statsMetadata);
    }

    async getMetadata(exId: string) {
        const ex = await this.get(exId) as ExecutionConfig;
        return ex.metadata ?? {};
    }

    // TODO: type this
    async updateMetadata(exId: string, metadata = {}) {
        await this.backend.update(exId, {
            metadata,
            _updated: makeISODate()
        });
    }

    // TODO: put a type of return
    async getStatus(exId: string): Promise<string> {
        try {
            const result = await this.get(exId) as ExecutionConfig;
            return result._status;
        } catch (err) {
            throw new TSError(err, {
                reason: `Cannot get execution status ${exId}`
            });
        }
    }

    // TODO: type this
    // verify the current status to make sure it can be updated to the desired status
    async verifyStatusUpdate(exId: string, desiredStatus: string) {
        if (!desiredStatus || !this._isValidStatus(desiredStatus)) {
            throw new TSError(`Invalid Job status: "${desiredStatus}"`, {
                statusCode: 422
            });
        }

        const status = await this.getStatus(exId);
        this._verifyStatus(status, desiredStatus);
    }

    private _verifyStatus(status: string, desiredStatus: string) {
        // when setting the same status to shouldn't throw an error
        if (desiredStatus === status) {
            return status;
        }
        // when the current status is running it cannot be set to an init status
        if (this._isRunningStatus(status) && this._isInitStatus(desiredStatus)) {
            throw new TSError(`Cannot update running job status of "${status}" to init status of "${desiredStatus}"`, {
                statusCode: 422
            });
        }
        // if it is set to stop but the execution finishes before it can stop
        // it is okay to set it to completed
        if (status === 'stopped' && desiredStatus === 'completed') {
            return status;
        }
        // when the status is a terminal status, it cannot be set to again
        if (this._isTerminalStatus(status)) {
            throw new TSError(`Cannot update terminal job status of "${status}" to "${desiredStatus}"`, {
                statusCode: 422
            });
        }

        // otherwise allow the update
        return status;
    }

    // TODO: type this
    /**
     * Set the status
     *
     * @param {string} exId
     * @param {string} status
     * @param {Partial<import('@terascope/job-components').ExecutionConfig>} body
     * @returns {Promise<import('@terascope/job-components').ExecutionConfig>}
    */
    async setStatus(
        exId: string,
        status: string,
        body?: Partial<ExecutionConfig>
    ): Promise<ExecutionConfig> {
        try {
            return await this.updatePartial(exId, async (existing) => {
                this._verifyStatus(existing._status, status);
                return Object.assign(existing, body, {
                    _status: status,
                    _updated: makeISODate()
                }) as ExecutionConfig;
            });
        } catch (err) {
            throw new TSError(err, {
                statusCode: 422,
                reason: `Unable to set execution ${exId} status code to ${status}`
            });
        }
    }

    async softDelete(exId: string) {
        try {
            const date = makeISODate();
            return await this.updatePartial(
                exId,
                async (existing) => Object.assign(existing, {
                    _deleted: true,
                    _deleted_on: date,
                    _updated: date
                })
            );
        } catch (err) {
            throw new TSError(err, {
                statusCode: 422,
                reason: `Unable to delete execution ${exId}`
            });
        }
    }

    async remove(exId: string) {
        return this.backend.remove(exId);
    }

    async shutdown(forceShutdown?: boolean) {
        this.logger.info('shutting down.');
        return this.backend.shutdown(forceShutdown);
    }

    verifyClient() {
        return this.backend.verifyClient();
    }

    async waitForClient() {
        return this.backend.waitForClient();
    }

    getTerminalStatuses() {
        return TERMINAL_STATUS.slice();
    }

    getRunningStatuses() {
        return RUNNING_STATUS.slice();
    }

    getLivingStatuses() {
        return INIT_STATUS.concat(RUNNING_STATUS);
    }

    private _isValidStatus(status: string): boolean {
        return includes(VALID_STATUS, status);
    }

    private _isRunningStatus(status: string) {
        return includes(RUNNING_STATUS, status);
    }

    private _isTerminalStatus(status: string) {
        return includes(TERMINAL_STATUS, status);
    }

    private _isInitStatus(status: string) {
        return includes(INIT_STATUS, status);
    }

    // TODO: fix types
    /**
     * @param {import('@terascope/job-components').ExecutionConfig} recoverFrom
     * @param {RecoveryCleanupType} [cleanupType]
     * @returns {Promise<import('@terascope/job-components').ExecutionConfig>}
    */
    async createRecoveredExecution(
        recoverFrom: ExecutionConfig,
        cleanupType?: RecoveryCleanupType
    ) {
        if (!recoverFrom) {
            throw new Error(`Invalid execution given, got ${getTypeOf(recoverFrom)}`);
        }
        if (!recoverFrom.ex_id) {
            throw new Error('Unable to recover execution with missing ex_id');
        }

        const recoverFromId = recoverFrom.ex_id;

        const ex = Object.assign({}, recoverFrom) as ExecutionConfig;
        if (cleanupType && !RecoveryCleanupType[cleanupType]) {
            throw new Error(`Unknown cleanup type "${cleanupType}" to recover`);
        }

        ex.recovered_execution = recoverFromId;

        if (cleanupType) {
            ex.recovered_slice_type = cleanupType;
        } else if (ex.autorecover) {
            ex.recovered_slice_type = RecoveryCleanupType.pending;
        }

        return this.create(ex);
    }
}
