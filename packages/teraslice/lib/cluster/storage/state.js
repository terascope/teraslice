'use strict';

const Promise = require('bluebird');
const { TSError } = require('@terascope/utils');
const { pRetry, toString } = require('@terascope/job-components');
const { timeseriesIndex } = require('../../utils/date_utils');
const elasticsearchBackend = require('./backends/elasticsearch_store');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function module(context) {
    const logger = context.apis.foundation.makeLogger({ module: 'state_storage' });
    const config = context.sysconfig.teraslice;
    const _index = `${config.name}__state`;
    // making this to pass down to backend for dynamic index searches
    const indexName = `${_index}*`;
    const timeseriesFormat = config.index_rollover_frequency.state;

    let backend;

    function createState(exId, slice, state, error) {
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

        return backend.indexWithId(slice.slice_id, record, index);
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

        const update = () => backend.update(slice.slice_id, record, indexData.index);

        return pRetry(update, {
            retries: 10000,
            delay: 1000,
            backoff: 5,
            matches: [
                'Request Timeout',
            ],
            endWithFatal: true,
            reason: `Failure to update ${state} state`
        });
    }

    function executionStartingSlice(exId, slicerId) {
        const startQuery = `ex_id:${exId} AND slicer_id:${slicerId}`;
        const recoveryData = {};

        return backend.search(startQuery, 0, 1, 'slicer_order:desc')
            .then((startingData) => {
                if (startingData.length > 0) {
                    recoveryData.lastSlice = JSON.parse(startingData[0].request);
                    logger.info(`last slice process for slicer_id ${slicerId}, ex_id: ${exId} is`, recoveryData.lastSlice);
                }

                return recoveryData;
            })
            .catch((err) => {
                const error = new TSError(err, {
                    reason: 'Failure getting the newest record'
                });
                return Promise.reject(error);
            });
    }

    function recoverSlices(exId, slicerId, cleanupType) {
        let retryQuery = `ex_id:${exId} AND slicer_id:${slicerId}`;

        if (cleanupType && cleanupType === 'errors') {
            retryQuery = `${retryQuery} AND state:error`;
        } else {
            retryQuery = `${retryQuery} AND NOT (state:completed OR state:invalid)`;
        }

        // Look for all slices that haven't been completed so they can be retried.
        return backend.refresh(indexName)
            .then(() => backend.search(retryQuery, 0, 5000))
            .then(results => results.map(doc => ({
                slice_id: doc.slice_id,
                slicer_id: doc.slicer_id,
                request: JSON.parse(doc.request),
                _created: doc._created
            })))
            .catch((err) => {
                const error = new TSError(err, {
                    reason: 'An error has occurred accessing the state log for retry'
                });
                return Promise.reject(error);
            });
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

    const api = {
        search,
        createState,
        updateState,
        recoverSlices,
        executionStartingSlice,
        count,
        shutdown
    };

    const backendConfig = {
        context,
        indexName,
        recordType: 'state',
        idField: '_id',
        fullResponse: false,
        logRecord: false
    };

    return elasticsearchBackend(backendConfig)
        .then((elasticsearch) => {
            backend = elasticsearch;
            logger.info('state storage initialized');
            return api;
        });
};
