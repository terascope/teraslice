'use strict';

// Cache of recently requested jobs, keyed by job_id
//var recordCache = {};

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
    var jobs_index = config.cluster.name + '__jobs';

    var backend;

    function get(record_id) {
        return backend.get(record_id);
    }

    function search(query, from, size) {
        return backend.search(query, from, size);
    }

    function getJobs(status, from, size, sort) {
        var query = '_status:*';

        if (status) query = '_status:' + status;

        return backend.search(query, from, size, sort);
    }

    function create(record) {
        // If this is a new job we'll need to allocate a new ID
        if (!record.job_id) record.job_id = uuid.v4();
        var date = new Date();
        if (!record._created) record._created = date;
        record._updated = date;

        return backend.create(record)
    }

    function update(record_id, update_spec) {
        // if (! job_spec.job_id) raise "Missing job_id updating job_spec"
// TODO this needs to be prepared for conflict resolution
        update_spec._updated = new Date();

        return backend.update(record_id, update_spec);
    }

    function remove(record_id) {
        return backend.remove(record_id);
    }

    function shutdown() {
        return backend.shutdown();
    }

    var api = {
        get: get,
        search: search,
        getJobs: getJobs,
        create: create,
        update: update,
        remove: remove,
        shutdown: shutdown
    };

    return require('./backends/elasticsearch')(context, jobs_index, 'job', 'job_id')
        .then(function(elasticsearch) {
            logger.info("JobStorage: initializing");
            backend = elasticsearch;

            return api;
        });
};