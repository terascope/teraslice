'use strict';

var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context) {
    var logger = context.logger;
    var config = context.sysconfig.teraslice;

    var index_name = `${config.name}__analytics`;

    var backend;

    function log(job, slice_info, stats) {
        var results = [];
        var timestamp = new Date().toISOString();

        // These records are uniquely identified by ex_id + slice_id
        job.jobConfig.operations.forEach(function(op, index) {
            results.push(backend.bulk({
// TODO: this doesn't actually know anything about the, worker_id
                "@timestamp": timestamp,
                ex_id: job.jobConfig.ex_id,
                worker_id: "",
                slice_id: slice_info.slice_id,
                slicer_id: slice_info.slicer_id,
                op: op._op,
                order: index,
                count: stats.size[index],
                time: stats.time[index]
            }));
        });

        return Promise.all(results);
    }

    function get(record_id) {
        return backend.get(record_id);
    }

    function search(query, from, size) {
        return backend.search(query, from, size);
    }

    function create(record) {
        // If this is a new job we'll need to allocate a new ID
        if (!record._id) record._id = uuid.v4();

        return backend.create(record)
    }

    function update(record_id, update_spec) {
        return backend.update(record_id, update_spec);
    }

    function remove(record_id) {
        return backend.remove(record_id);
    }

    function shutdown() {
        return backend.shutdown();
    }

    var api = {
        log: log,
        get: get,
        search: search,
        create: create,
        update: update,
        remove: remove,
        shutdown: shutdown
    };

    return require('./backends/elasticsearch')(context, index_name, 'analytics', '_id')
        .then(function(elasticsearch) {
            logger.info("AnalyticsStorage: initializing");
            backend = elasticsearch;

            return api;
        });
};