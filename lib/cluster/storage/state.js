'use strict';

var Promise = require('bluebird');
var _ = require('lodash');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context) {
    var logger = context.foundation.makeLogger('state_storage', 'state_storage', {storage: 'state_storage'});
    var config = context.sysconfig.teraslice;

    // TODO: this needs to be properly named
    var index_name = `${config.name}__state`;

    var backend;

    function log(ex_id, slice, state, error) {
        var timestamp = new Date().toISOString();
        var record = {
            '@timestamp': timestamp,
            slice_id: slice.slice_id,
            slicer_id: slice.slicer_id,
            request: JSON.stringify(slice.request),
            state: state,
            ex_id: ex_id
        };

        if (error) {
            var errMsg = typeof error === 'string' ? error : JSON.stringify(error);
            record.error = errMsg;
        }

        // This is necessary for recovery to find the latest slice.
        // It's mainly applicable for elasticsearch. Using @timestamp
        // doesn't work because slices can be processed out of order.
        // TODO: see if we can figure out a more general algorithm.
        if (slice.request.end) {
            record.end = slice.request.end;
        }

        return backend.indexWithId(slice.slice_id, record);
    }

    function recoveryContext(ex_id, slicer_id) {
        var startQuery = `ex_id:${ex_id} AND slicer_id:${slicer_id}`;
        var retryQuery = `${startQuery} AND NOT state:completed`;

        // TODO: refactor 5,000 to dynamic limits split between slicers so it equals config limit
        // Look for all slices that haven't been completed so they can be retried.
        return backend.search(retryQuery, 0, 5000)
            .then(function(results) {
                var retryList = results.map(function(doc) {
                    return {
                        slice_id: doc.slice_id,
                        slicer_id: doc.slicer_id,
                        request: JSON.parse(doc.request)
                    }
                });

                var recoveryContext = {
                    retryList: retryList,
                    slicer_id: slicer_id,
                    ex_id: ex_id
                };

                // Find the newest record to see where to start processing from
                return backend.search(startQuery, 0, 1, 'end:desc')
                    .then(function(results) {
                        if (results.length > 0) {
                            recoveryContext.lastSlice = JSON.parse(results[0].request);
                        }

                        return recoveryContext;
                    })
                    .catch(function(err) {
                        logger.error('StateStorage: An error occurred getting the newest record');
                        return Promise.reject(err)
                    })
            })
            .catch(function(err) {
                logger.error('StateStorage: An error has occurred accessing the state log for retry');
                return Promise.reject(err)
            });
    }

    function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }

    function count(query, from, sort) {
        return backend.count(query, from, sort)
    }

    function shutdown() {
        logger.info("shutting down.");
        return backend.shutdown();
    }

    var api = {
        search: search,
        log: log,
        recoveryContext: recoveryContext,
        count: count,
        shutdown: shutdown
    };

    return require('./backends/elasticsearch')(context, index_name, 'state', '_id')
        .then(function(elasticsearch) {
            logger.info("initializing");
            backend = elasticsearch;

            return api;
        });
};
