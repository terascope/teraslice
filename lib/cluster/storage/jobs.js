'use strict';

// Cache of recently requested jobs, keyed by job_id
//var recordCache = {};

var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context, jobType) {
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
        if (jobType === 'job') {
            if (!record.job_id) record.job_id = uuid.v4();
        }
        else {
            if (!record.jx_id) record.jx_id = uuid.v4();
            var date = new Date();
            if (!record._created) record._created = date;
            record._updated = date;
        }
       

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

    var jobArgs = [context, jobs_index];

    if (jobType === 'job') {
        jobArgs.push('job', 'job_id')
    }
    else {
        jobArgs.push('jx', 'jx_id')
    }

    return require('./backends/elasticsearch').apply(null, jobArgs)
        .then(function(elasticsearch) {
            logger.info(`JobStorage for ${jobType}: initializing`);
            backend = elasticsearch;

            return api;
        });
};