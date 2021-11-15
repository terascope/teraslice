'use strict';

const {
    RecoveryCleanupType
} = require('@terascope/job-components');
const {
    TSError,
    pRetry,
    toString,
    isRetryableError,
    parseErrorInfo,
    isTest,
    times,
    getFullErrorStack,
} = require('@terascope/utils');
const { timeseriesIndex } = require('../utils/date_utils');
const { makeLogger } = require('../workers/helpers/terafoundation');
const elasticsearchBackend = require('./backends/elasticsearch_store');

const SliceState = Object.freeze({
    pending: 'pending',
    start: 'start',
    error: 'error',
    completed: 'completed',
});

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
async function stateStorage(context) {
    const recordType = 'state';

    const logger = makeLogger(context, 'state_storage');
    const config = context.sysconfig.teraslice;
    const _index = `${config.name}__state`;
    // making this to pass down to backend for dynamic index searches
    const indexName = `${_index}*`;
    const timeseriesFormat = config.index_rollover_frequency.state;

    const backendConfig = {
        context,
        indexName,
        recordType,
        idField: 'slice_id',
        fullResponse: false,
        logRecord: true,
        forceRefresh: false,
        storageName: 'state'
    };

    const backend = await elasticsearchBackend(backendConfig);

    async function createState(exId, slice, state, error) {
        await waitForClient();

        const { record, index } = _createSliceRecord(exId, slice, state, error);
        return backend.indexWithId(slice.slice_id, record, index);
    }

    async function createSlices(exId, slices) {
        await waitForClient();

        const bulkRequest = slices.map((slice) => {
            const { record, index } = _createSliceRecord(exId, slice, SliceState.pending);
            return {
                action: {
                    index: {
                        _index: index,
                        _type: recordType,
                        _id: record.slice_id,
                    },
                },
                data: record
            };
        });
        return backend.bulkSendImproved(bulkRequest);
    }

    function _createSliceRecord(exId, slice, state, error) {
        if (!SliceState[state]) {
            throw new Error(`Unknown slice state "${state}" on create`);
        }
        const { index } = timeseriesIndex(timeseriesFormat, _index, slice._created);
        const record = {
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

    async function updateState(slice, state, error) {
        if (!SliceState[state]) {
            throw new Error(`Unknown slice state "${state}" on update`);
        }

        const indexData = timeseriesIndex(timeseriesFormat, _index, slice._created);
        const record = {
            _updated: indexData.timestamp,
            state
        };

        // it will usaully just be error
        if (state === SliceState.error || error) {
            if (error) {
                record.error = getFullErrorStack(error);
            } else {
                record.error = new Error('Unkown slice error').stack;
            }
        }

        let notFoundErrCount = 0;

        async function update() {
            await waitForClient();

            try {
                return await backend.update(slice.slice_id, record, indexData.index);
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
    async function _getSlicerStartingPoint(exId, slicerId) {
        const startQuery = `ex_id:"${exId}" AND slicer_id:"${slicerId}" AND state:${SliceState.completed}`;
        await waitForClient();

        try {
            const [slice] = await search(startQuery, 0, 1, 'slicer_order:desc');
            const recoveryData = {
                slicer_id: slicerId,
                lastSlice: undefined
            };

            if (slice) {
                recoveryData.lastSlice = JSON.parse(slice.request);
                logger.info(`last slice process for slicer_id ${slicerId}, ex_id: ${exId} is`, slice.lastSlice);
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
    async function getStartingPoints(exId, slicers) {
        const recoveredSlices = times(slicers, (i) => _getSlicerStartingPoint(exId, i));
        return Promise.all(recoveredSlices);
    }

    /**
     * @private
     * @param {string} exId
     * @param {number} slicerId
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @returns {string}
    */
    function _getRecoverSlicesQuery(exId, slicerId, cleanupType) {
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
        logger.debug('recovery slices query:', query);
        return query;
    }

    /**
     * @param {string} exId
     * @param {number} slicerId
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @returns {Promise<import('@terascope/job-components').Slice[]>}
    */
    async function recoverSlices(exId, slicerId, cleanupType) {
        const query = _getRecoverSlicesQuery(exId, slicerId, cleanupType);
        // Look for all slices that haven't been completed so they can be retried.
        try {
            await waitForClient();
            await backend.refresh(indexName);

            const results = await search(query, 0, 5000, 'slicer_order:desc');
            return results.map((doc) => ({
                slice_id: doc.slice_id,
                slicer_id: doc.slicer_id,
                request: JSON.parse(doc.request),
                _created: doc._created
            }));
        } catch (err) {
            throw new TSError(err, {
                reason: 'Failure to get recovered slices'
            });
        }
    }

    async function search(query, from, size, sort, fields) {
        return backend.search(query, from, size, sort || '_updated:desc', fields);
    }

    async function count(query, from = 0, sort = '_updated:desc') {
        return backend.count(query, from, sort);
    }

    async function countByState(exId, state) {
        if (!SliceState[state]) {
            throw new Error(`Unknown slice state "${state}" on update`);
        }
        const query = `ex_id:"${exId}" AND state:${state}`;
        return count(query);
    }

    async function shutdown(forceShutdown) {
        logger.info('shutting down');
        return backend.shutdown(forceShutdown);
    }

    async function refresh() {
        const { index } = timeseriesIndex(timeseriesFormat, _index);
        return backend.refresh(index);
    }

    function verifyClient() {
        return backend.verifyClient();
    }

    async function waitForClient() {
        return backend.waitForClient();
    }

    logger.info('state storage initialized');
    return {
        search,
        createState,
        createSlices,
        updateState,
        recoverSlices,
        getStartingPoints,
        count,
        countByState,
        waitForClient,
        verifyClient,
        shutdown,
        refresh,
    };
}

stateStorage.SliceState = SliceState;

module.exports = stateStorage;
