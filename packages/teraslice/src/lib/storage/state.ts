import { Context, RecoveryCleanupType, Slice } from '@terascope/job-components';
import {
    TSError, pRetry, toString,
    isRetryableError, parseErrorInfo, isTest,
    times, getFullErrorStack, Logger, isKey
} from '@terascope/core-utils';
import { timeseriesIndex, TimeseriesFormat } from '../utils/date_utils.js';
import { makeLogger } from '../workers/helpers/terafoundation.js';
import { TerasliceElasticsearchStorage, TerasliceESStorageConfig } from './backends/elasticsearch_store.js';

export const SliceState = Object.freeze({
    pending: 'pending',
    start: 'start',
    error: 'error',
    completed: 'completed',
});

export class StateStorage {
    private backend: TerasliceElasticsearchStorage;
    logger: Logger;
    readonly recordType: string;
    private readonly timeseriesFormat: TimeseriesFormat;
    readonly baseIndex: string;
    readonly index: string;

    constructor(context: Context) {
        const recordType = 'state';

        const logger = makeLogger(context, 'state_storage');
        const config = context.sysconfig.teraslice;
        const _index = `${config.name}__state`;
        // making this to pass down to backend for dynamic index searches
        const indexName = `${_index}*`;
        const timeseriesFormat = config.index_rollover_frequency.state as TimeseriesFormat;

        const backendConfig: TerasliceESStorageConfig = {
            context,
            indexName,
            recordType,
            idField: 'slice_id',
            fullResponse: false,
            logRecord: true,
            forceRefresh: false,
            storageName: 'state',
            logger
        };

        this.backend = new TerasliceElasticsearchStorage(backendConfig);
        this.logger = logger;
        this.recordType = recordType;
        this.timeseriesFormat = timeseriesFormat;
        this.baseIndex = _index;
        this.index = indexName;
    }

    async initialize() {
        await this.backend.initialize();
        this.logger.info('state storage initialized');
    }

    async createState(exId: string, slice: any, state: any, error?: Error) {
        const { record, index } = this._createSliceRecord(exId, slice, state, error);
        return this.backend.indexWithId(slice.slice_id, record, index);
    }

    async createSlices(exId: string, slices: Slice[]) {
        const bulkRequest = slices.map((slice) => {
            const { record, index } = this._createSliceRecord(exId, slice, SliceState.pending);
            return {
                action: {
                    index: {
                        _index: index,
                        _id: record.slice_id,
                    },
                },
                data: record
            };
        });

        return this.backend.bulkSend(bulkRequest);
    }

    private _createSliceRecord(exId: string, slice: any, state: any, error?: Error) {
        if (!isKey(SliceState, state)) {
            throw new Error(`Unknown slice state "${state}" on create`);
        }
        const { index } = timeseriesIndex(
            this.timeseriesFormat, this.baseIndex, slice._created
        );
        // TODO: type this better
        const record: Record<string, any> = {
            slice_id: slice.slice_id,
            slicer_id: slice.slicer_id,
            slicer_order: slice.slicer_order,
            request: JSON.stringify(slice.request),
            state,
            ex_id: exId,
            _created: slice._created,
            _updated: slice._created,
        };

        if (error) {
            record.error = toString(error);
        }

        return { record, index };
    }

    // TODO: type this better
    async updateState(slice: Slice, state: string, error?: Error) {
        if (!isKey(SliceState, state)) {
            throw new Error(`Unknown slice state "${state}" on update`);
        }

        const indexData = timeseriesIndex(
            this.timeseriesFormat, this.baseIndex, slice._created
        );

        // TODO: type this better
        const record: Record<string, any> = {
            _updated: indexData.timestamp,
            state
        };

        // it will usaully just be error
        if (state === SliceState.error || error) {
            if (error) {
                record.error = getFullErrorStack(error);
            } else {
                record.error = new Error('Unknown slice error').stack;
            }
        }

        let notFoundErrCount = 0;
        const updateFn = this.backend.update.bind(this.backend);

        async function update() {
            try {
                return await updateFn(slice.slice_id, record, indexData.index);
            } catch (_err) {
                const { statusCode, message } = parseErrorInfo(_err);
                let retryable = isRetryableError(_err);

                if (statusCode === 404) {
                    notFoundErrCount++;
                    retryable = notFoundErrCount < 3;
                } else if (message.includes('Request Timeout')) {
                    retryable = true;
                }

                throw new TSError(_err, {
                    retryable,
                    reason: `Failure to update ${state} state`
                });
            }
        }

        return pRetry(update, {
            retries: 10000,
            delay: isTest ? 100 : 1000,
            backoff: 5,
            endWithFatal: true,
        });
    }

    /**
     * Get the starting position for the slicer
     *
     * @param {string} exId
     * @param {number} slicerId
     * @returns {Promise<import('@terascope/job-components').SlicerRecoveryData>}
    */
    private async _getSlicerStartingPoint(exId: string, slicerId: number) {
        const startQuery = `ex_id:"${exId}" AND slicer_id:"${slicerId}" AND state:${SliceState.completed}`;

        try {
            const [slice] = await this.search(startQuery, 0, 1, 'slicer_order:desc') as any[];
            const recoveryData = {
                slicer_id: slicerId,
                lastSlice: undefined
            };

            if (slice) {
                recoveryData.lastSlice = JSON.parse(slice.request);
                this.logger.info(`last slice process for slicer_id ${slicerId}, ex_id: ${exId} is`, slice.lastSlice);
            }

            return recoveryData;
        } catch (err) {
            throw new TSError(err, {
                reason: 'Failure getting the newest record'
            });
        }
    }

    /**
     * Get the starting positions for all of the slicers
     *
     * @param {string} exId
     * @param {number} slicer
     * @returns {Promise<import('@terascope/job-components').SlicerRecoveryData[]>}
    */
    async getStartingPoints(exId: string, slicers: number) {
        const recoveredSlices = times(slicers, (i) => this._getSlicerStartingPoint(exId, i));
        return Promise.all(recoveredSlices);
    }

    // TODO: fix types
    /**
     * @private
     * @param {string} exId
     * @param {number} slicerId
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @returns {string}
    */
    private _getRecoverSlicesQuery(exId: string, slicerId: number, cleanupType: string) {
        let query = `ex_id:"${exId}"`;

        if (slicerId !== -1) {
            query = `${query} AND slicer_id:"${slicerId}"`;
        }

        if (cleanupType && cleanupType === RecoveryCleanupType.errors) {
            query = `${query} AND state:"${SliceState.error}"`;
        } else if (cleanupType && cleanupType === RecoveryCleanupType.pending) {
            query = `${query} AND state:"${SliceState.pending}"`;
        } else {
            query = `${query} AND NOT state:"${SliceState.completed}"`;
        }

        this.logger.debug('recovery slices query:', query);
        return query;
    }

    /**
     * @param {string} exId
     * @param {number} slicerId
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @returns {Promise<import('@terascope/job-components').Slice[]>}
    */
    async recoverSlices(
        exId: string,
        slicerId: number,
        cleanupType: RecoveryCleanupType
    ): Promise<Slice[]> {
        const query = this._getRecoverSlicesQuery(exId, slicerId, cleanupType);
        // Look for all slices that haven't been completed so they can be retried.
        try {
            await this.backend.refresh(this.index);

            const results = await this.search(query, 0, 5000, 'slicer_order:desc') as any[];

            return results.map((doc) => ({
                slice_id: doc.slice_id,
                slicer_id: doc.slicer_id,
                request: JSON.parse(doc.request),
                _created: doc._created
            })) as Slice[];
        } catch (err) {
            throw new TSError(err, {
                reason: 'Failure to get recovered slices'
            });
        }
    }

    async search(
        query: string | Record<string, any>,
        from?: number,
        size?: number,
        sort?: string,
        fields?: string | string[]
    ) {
        return this.backend.search(query, from, size, sort || '_updated:desc', fields);
    }

    async count(
        query: string | Record<string, any>,
        from = 0,
        sort = '_updated:desc'
    ) {
        return this.backend.count(query, from, sort);
    }

    async countByState(exId: string, state: string) {
        if (!isKey(SliceState, state)) {
            throw new Error(`Unknown slice state "${state}" on update`);
        }
        const query = `ex_id:"${exId}" AND state:${state}`;

        return this.count(query);
    }

    async shutdown(forceShutdown?: boolean) {
        this.logger.info('shutting down');
        return this.backend.shutdown(forceShutdown);
    }

    async refresh() {
        const { index } = timeseriesIndex(this.timeseriesFormat, this.baseIndex);
        return this.backend.refresh(index);
    }

    verifyClient() {
        return this.backend.verifyClient();
    }

    async waitForClient() {
        return this.backend.waitForClient();
    }
}
