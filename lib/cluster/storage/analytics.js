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

    // TODO: this needs to be properly named
    var index_name = config.cluster.name + '__analytics';

    var backend = require('./backends/elasticsearch')(context, index_name, 'analytics', '_id');

    function log(job, slice_info, stats) {
//console.log(job.jobConfig);
        var results = [];
        var timestamp = new Date().toISOString();

        // These records are uniquely identified by job_id + start
        job.jobConfig.operations.forEach(function(op, index) {
            results.push(backend.index({
// TODO: this doesn't actually know anything about the, worker_id
                "@timestamp": timestamp,
                job_id: job.jobConfig.job_id,
                worker_id: "",
                start: slice_info.start,
                end: slice_info.end,
                op: op._op,
                order: index,
                count: stats.size[index],
                time: stats.time[index]
            }));
        });

        Promise.all(results).then(function() { return true; });
    }

    function get(record_id) {
        return backend.get(record_id);
    }

    function search(query, from, size) {
        return backend.search(query, from, size);
    }

    function create(record) {
        // If this is a new job we'll need to allocate a new ID
        if (! record._id) record._id = uuid.v4();

        return backend.create(record)
    }

    function update(record_id, update_spec) {
        return backend.update(record_id, update_spec);
    }

    function remove(record_id) {
        return backend.remove(record_id);
    }

    return {
        log: log,
        get: get,
        search: search,
        create: create,
        update: update,
        remove: remove
    }
}