'use strict';

// Cache of recently requested jobs, keyed by job_id
//var recordCache = {};

var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');
var parseError = require('../../utils/error_utils').parseError;

var RUNNING_STATUS = ['pending', 'scheduling', 'initializing', 'running', 'failing', 'paused', 'moderator_paused'];
var TERMINAL_STATUS = ['completed', 'stopped', 'rejected', 'failed', 'terminated'];

var VALID_STATUS = RUNNING_STATUS.concat(TERMINAL_STATUS);

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context, jobType) {
    var logger = context.foundation.makeLogger(`${jobType}_storage`, `${jobType}_storage`, {module: `${jobType}_storage`});
    var config = context.sysconfig.teraslice;
    var state_store;
    var jobs_index = config.name + '__jobs';

    var backend;

    function get(record_id) {
        return backend.get(record_id);
    }

    function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }

    function getExecutionContexts(status, from, size, sort) {
        var query = '_context:ex';

        if (status) query += `AND _status:${status}`;
        logger.debug(`full getExecutionContexts query ${query}`);
        return backend.search(query, from, size, sort);
    }

    function getJobs(from, size, sort) {
        var query = 'job_id:* NOT ex_id:*';
        return backend.search(query, from, size, sort);
    }

    function create(record) {
        var date = new Date();

        if (jobType === 'job') {
            record.job_id = uuid.v4();
        }
        else {
            record.ex_id = uuid.v4();
        }

        record._context = jobType;
        record._created = date;
        record._updated = date;

        return backend.create(record)
    }

    function update(record_id, update_spec) {
        update_spec._updated = new Date();

        return backend.update(record_id, update_spec);
    }

    function failureMeta(errMsg, stats) {
        var metaData = {_has_errors: 'true', _slicer_stats: stats};
        if (errMsg) {
            metaData._failureReason = errMsg;
        }
        return metaData
    }

    function setStatus(ex_id, status, metaData) {
        if (isValidStatus(status)) {
            var statusObj = {_status: status};
            if (metaData) {
                _.assign(statusObj, metaData)
            }
            return update(ex_id, statusObj)
                .then(function(doc) {
                    return ex_id;
                })
                .catch(function(err) {
                    var errMsg = parseError(err);
                    logger.error('was not able to _etStatus, error:', errMsg, ex_id, statusObj);
                    return Promise.reject(errMsg);
                });
        }
        else {
            return Promise.reject(`Invalid Job status: ${status}`);
        }
    }

    function remove(record_id) {
        return backend.remove(record_id);
    }

    function shutdown() {
        logger.info("shutting down.");
        return backend.shutdown();
    }

    function getJobStateRecords(query, from, size, sort) {
        return state_store.search(query, from, size, sort)
    }

    function getTerminalStatuses() {
        return TERMINAL_STATUS.slice();
    }

    function getRunningStatuses() {
        return RUNNING_STATUS.slice();
    }

    function isValidStatus(status) {
        return _.find(VALID_STATUS, valid => valid === status) !== undefined
    }

    var api = {
        get: get,
        search: search,
        getJobs: getJobs,
        getExecutionContexts: getExecutionContexts,
        create: create,
        update: update,
        remove: remove,
        shutdown: shutdown,
        getJobStateRecords: getJobStateRecords,
        getTerminalStatuses: getTerminalStatuses,
        getRunningStatuses: getRunningStatuses,
        isValidStatus: isValidStatus,
        setStatus: setStatus,
        failureMeta: failureMeta
    };

    var jobArgs = [context, jobs_index];

    if (jobType === 'job') {
        jobArgs.push('job', 'job_id')
    }
    else {
        jobArgs.push('job', 'ex_id')
    }

    return Promise.all([require('./state')(context), require('./backends/elasticsearch_store').apply(null, jobArgs)])
        .spread(function(state, elasticsearch) {
            logger.info(`Initializing`);
            backend = elasticsearch;
            state_store = state;
            return api;
        });
};
