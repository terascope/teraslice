'use strict';


const uuid = require('uuid');
const Promise = require('bluebird');
const _ = require('lodash');
const parseError = require('error_parser');

const RUNNING_STATUS = ['pending', 'scheduling', 'initializing', 'running', 'failing', 'paused', 'moderator_paused'];
const TERMINAL_STATUS = ['completed', 'stopped', 'rejected', 'failed', 'terminated'];

const VALID_STATUS = RUNNING_STATUS.concat(TERMINAL_STATUS);

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function (context) {
    const logger = context.apis.foundation.makeLogger({ module: 'ex_storage' });
    const config = context.sysconfig.teraslice;
    const jobType = 'ex';
    const jobsIndex = `${config.name}__ex`;

    let backend;

    function getExecution(exId) {
        return backend.get(exId);
    }

    function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }

    function create(record) {
        const date = new Date();
        record.ex_id = uuid.v4();
        record._context = jobType;
        record._created = date;
        record._updated = date;

        return backend.create(record);
    }

    function update(exId, updateSpec) {
        updateSpec._updated = new Date();
        return backend.update(exId, updateSpec);
    }

    function failureMeta(errMsg, stats) {
        const metaData = { _has_errors: 'true', _slicer_stats: stats };
        if (errMsg) {
            metaData._failureReason = errMsg;
        }
        return metaData;
    }

    function setStatus(exId, status, metaData) {
        if (_isValidStatus(status)) {
            const statusObj = { _status: status };
            if (metaData) {
                _.assign(statusObj, metaData);
            }
            return update(exId, statusObj)
                .then(() => exId)
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error(`was not able to change status to ${JSON.stringify(statusObj)} on ex: ${exId}, error: ${errMsg}`);
                    return Promise.reject(errMsg);
                });
        }

        return Promise.reject(`Invalid Job status: ${status}`);
    }

    function remove(exId) {
        return backend.remove(exId);
    }

    function shutdown() {
        logger.info('shutting down.');
        return backend.shutdown();
    }

    function getTerminalStatuses() {
        return TERMINAL_STATUS.slice();
    }

    function getRunningStatuses() {
        return RUNNING_STATUS.slice();
    }

    function _isValidStatus(status) {
        return _.find(VALID_STATUS, valid => valid === status) !== undefined;
    }

    const api = {
        get: getExecution,
        search,
        create,
        update,
        remove,
        shutdown,
        getTerminalStatuses,
        getRunningStatuses,
        setStatus,
        failureMeta
    };

    return require('./backends/elasticsearch_store')(context, jobsIndex, 'ex', 'ex_id')
        .then((elasticsearch) => {
            logger.info('Initializing');
            backend = elasticsearch;
            return api;
        });
};
