'use strict';

const Promise = require('bluebird');
const parseError = require('@terascope/error-parser');
const { timeseriesIndex } = require('../../utils/date_utils');

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
            _created: slice._created,
            _updated: slice._created,
            slice_id: slice.slice_id,
            slicer_id: slice.slicer_id,
            slicer_order: slice.slicer_order,
            request: JSON.stringify(slice.request),
            state,
            ex_id: exId
        };

        if (error) {
            const errMsg = typeof error === 'string' ? error : JSON.stringify(error);
            record.error = errMsg;
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
            const errMsg = typeof error === 'string' ? error : JSON.stringify(error);
            record.error = errMsg;
        }

        return backend.update(slice.slice_id, record, indexData.index);
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
                const errMsg = parseError(err);
                logger.error(`StateStorage: An error occurred getting the newest record, error: ${errMsg}`);
                return Promise.reject(errMsg);
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
                const errMsg = parseError(err);
                logger.error(`StateStorage: An error has occurred accessing the state log for retry, error: ${errMsg}`);
                return Promise.reject(errMsg);
            });
    }

    function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }

    function count(query, from, sort) {
        return backend.count(query, from, sort);
    }

    function shutdown() {
        logger.info('shutting down');
        return backend.shutdown();
    }

    function destroy() {
        logger.info('destroying backend');
        return backend.destroy();
    }

    const api = {
        search,
        createState,
        updateState,
        recoverSlices,
        executionStartingSlice,
        count,
        destroy,
        shutdown
    };

    return require('./backends/elasticsearch_store')(context, indexName, 'state', '_id')
        .then((elasticsearch) => {
            backend = elasticsearch;
            logger.info('initializing');
            return api;
        });
};
