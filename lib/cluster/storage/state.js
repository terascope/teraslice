'use strict';

var Promise = require('bluebird');
var parseError = require('../../utils/error_utils').parseError;
var template = require('./backends/mappings/state.json');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context) {
    var logger = context.foundation.makeLogger({module: 'state_storage'});
    var config = context.sysconfig.teraslice;
    var _index = `${config.name}__state`;
    //making this to pass down to backend for dynamic index searches
    var index_name = `${_index}*`;

    var backend;

    function createState(ex_id, slice, state, error) {
        var index = `${_index}-${slice._created.slice(0, 10).replace(/-/g, '.')}`;
        var record = {
            _created: slice._created,
            slice_id: slice.slice_id,
            slicer_id: slice.slicer_id,
            slicer_order: slice.slicer_order,
            request: JSON.stringify(slice.request),
            state: state,
            ex_id: ex_id
        };

        if (error) {
            var errMsg = typeof error === 'string' ? error : JSON.stringify(error);
            record.error = errMsg;
        }

        return backend.indexWithId(slice.slice_id, record, index);
    }

    function updateState(slice, state, error) {
        var timestamp = new Date().toISOString();
        var index = `${_index}-${slice._created.slice(0, 10).replace(/-/g, '.')}`;
        var record = {
            _updated: timestamp,
            state: state
        };

        if (error) {
            var errMsg = typeof error === 'string' ? error : JSON.stringify(error);
            record.error = errMsg;
        }

        return backend.update(slice.slice_id, record, index)

    }

    function recoveryContext(ex_id, slicer_id) {
        var startQuery = `ex_id:${ex_id} AND slicer_id:${slicer_id}`;
        var retryQuery = `${startQuery} AND NOT state:completed`;

        // Look for all slices that haven't been completed so they can be retried.
        return backend.refresh(index_name)
            .then(function() {
                return backend.search(retryQuery, 0, 5000)
            })
            .then(function(results) {
                var retryList = results.map(function(doc) {
                    return {
                        slice_id: doc.slice_id,
                        slicer_id: doc.slicer_id,
                        request: JSON.parse(doc.request),
                        _created: doc._created
                    }
                });
                var recoveryContext = {
                    retryList: retryList,
                    slicer_id: slicer_id,
                    ex_id: ex_id
                };
                logger.debug(`retry for slicer_id ${slicer_id}, ex_id: ${ex_id} has ${retryList.length} slices`);

                // Find the newest record to see where to start processing from
                return backend.search(startQuery, 0, 1, 'slicer_order:desc')
                    .then(function(results) {
                        if (results.length > 0) {
                            recoveryContext.lastSlice = JSON.parse(results[0].request);
                            logger.debug(`last slice process for slicer_id ${slicer_id}, ex_id: ${ex_id} is`, recoveryContext.lastSlice)
                        }

                        return recoveryContext;
                    })
                    .catch(function(err) {
                        var errMsg = parseError(err);
                        logger.error(`StateStorage: An error occurred getting the newest record, error: ${errMsg}`);
                        return Promise.reject(errMsg)
                    })
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`StateStorage: An error has occurred accessing the state log for retry, error: ${errMsg}`);
                return Promise.reject(errMsg)
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
        createState: createState,
        updateState: updateState,
        recoveryContext: recoveryContext,
        count: count,
        shutdown: shutdown
    };

    return require('./backends/elasticsearch_store')(context, index_name, 'state', '_id')
        .then(function(elasticsearch) {
            var name = 'state_template';
            backend = elasticsearch;
            return elasticsearch.putTemplate(template, name)
        })
        .then(function() {
            logger.info("initializing");
            return api;
        });
};
