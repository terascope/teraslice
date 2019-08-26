'use strict';

const Promise = require('bluebird');
const {
    TSError,
    pRetry,
    toString,
    isRetryableError,
    parseErrorInfo,
    isTest,
} = require('@terascope/utils');
const { timeseriesIndex } = require('../../utils/date_utils');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const elasticsearchBackend = require('./backends/elasticsearch_store');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = async function stateStorage(context) {
    const recordType = 'state';

    const logger = makeLogger(context, 'state_storage');
    const config = context.sysconfig.teraslice;
    const _index = `${config.name}__state`;
    // making this to pass down to backend for dynamic index searches
    const indexName = `${_index}*`;
    const timeseriesFormat = config.index_rollover_frequency.state;

    let backend;

    async function createState(exId, slice, state, error) {
        await waitForClient();

        const { record, index } = _createSliceRecord(exId, slice, state, error);
        return backend.indexWithId(slice.slice_id, record, index);
    }

    async function createSlices(exId, slices) {
        await waitForClient();

        const bulkRequest = [];
        for (const slice of slices) {
            const { record, index } = _createSliceRecord(exId, slice, 'start');
            bulkRequest.push({
                index: {
                    _index: index,
                    _type: recordType,
                    _id: record.slice_id,
                },
            }, record);
        }
        return backend.bulkSend(bulkRequest);
    }

    function _createSliceRecord(exId, slice, state, error) {
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

    function updateState(slice, state, error) {
        const indexData = timeseriesIndex(timeseriesFormat, _index, slice._created);
        const record = {
            _updated: indexData.timestamp,
            state
        };

        if (error) {
            record.error = toString(error);
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

    async function executionStartingSlice(exId, slicerId) {
        const startQuery = `ex_id:${exId} AND slicer_id:${slicerId}`;
        const recoveryData = {};

        await waitForClient();

        try {
            const startingData = await backend.search(startQuery, 0, 1, 'slicer_order:desc');
            if (startingData.length > 0) {
                recoveryData.lastSlice = JSON.parse(startingData[0].request);
                logger.info(`last slice process for slicer_id ${slicerId}, ex_id: ${exId} is`, recoveryData.lastSlice);
            }

            return recoveryData;
        } catch (err) {
            throw new TSError(err, {
                reason: 'Failure getting the newest record'
            });
        }
    }

    async function recoverSlices(exId, slicerId, cleanupType) {
        let retryQuery = `ex_id:${exId} AND slicer_id:${slicerId}`;

        if (cleanupType && cleanupType === 'errors') {
            retryQuery = `${retryQuery} AND state:error`;
        } else {
            retryQuery = `${retryQuery} AND NOT (state:completed OR state:invalid)`;
        }

        // Look for all slices that haven't been completed so they can be retried.
        try {
            await waitForClient();
            await backend.refresh(indexName);

            const results = await backend.search(retryQuery, 0, 5000);
            return results.map((doc) => ({
                slice_id: doc.slice_id,
                slicer_id: doc.slicer_id,
                request: JSON.parse(doc.request),
                _created: doc._created
            }));
        } catch (err) {
            const error = new TSError(err, {
                reason: 'An error has occurred accessing the state log for retry'
            });
            return Promise.reject(error);
        }
    }

    function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }

    function count(query, from, sort) {
        return backend.count(query, from, sort);
    }

    function shutdown(forceShutdown) {
        logger.info('shutting down');
        return backend.shutdown(forceShutdown);
    }

    function refresh() {
        const { index } = timeseriesIndex(timeseriesFormat, _index);
        return backend.refresh(index);
    }

    function verifyClient() {
        return backend.verifyClient();
    }

    function waitForClient() {
        return backend.waitForClient();
    }

    const api = {
        search,
        createState,
        createSlices,
        updateState,
        recoverSlices,
        executionStartingSlice,
        count,
        waitForClient,
        verifyClient,
        shutdown,
        refresh,
    };

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

    const elasticsearch = await elasticsearchBackend(backendConfig);
    backend = elasticsearch;
    logger.info('state storage initialized');
    return api;
};
