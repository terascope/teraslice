'use strict';

const uuid = require('uuid');
const Promise = require('bluebird');
const _ = require('lodash');
const parseError = require('@terascope/error-parser');

const INIT_STATUS = ['pending', 'scheduling', 'initializing'];
const RUNNING_STATUS = ['running', 'failing', 'paused', 'moderator_paused'];
const TERMINAL_STATUS = ['completed', 'stopped', 'rejected', 'failed', 'terminated'];

const VALID_STATUS = INIT_STATUS.concat(RUNNING_STATUS).concat(TERMINAL_STATUS);

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function module(context) {
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

    function executionMetaData(stats, errMsg) {
        let hasErrors = false;
        if (errMsg) hasErrors = true;
        const metaData = { _has_errors: hasErrors, _slicer_stats: stats };
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
                    return Promise.reject(new Error(errMsg));
                });
        }

        return Promise.reject(new Error(`Invalid Job status: ${status}`));
    }

    function remove(exId) {
        return backend.remove(exId);
    }

    function shutdown(forceShutdown) {
        logger.info('shutting down.');
        return backend.shutdown(forceShutdown);
    }

    function getTerminalStatuses() {
        return TERMINAL_STATUS.slice();
    }

    function getRunningStatuses() {
        return RUNNING_STATUS.slice();
    }

    function getLivingStatuses() {
        return INIT_STATUS.concat(RUNNING_STATUS);
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
        getLivingStatuses,
        setStatus,
        executionMetaData
    };

    return require('./backends/elasticsearch_store')(context, jobsIndex, 'ex', 'ex_id')
        .then((elasticsearch) => {
            logger.info('Initializing');
            backend = elasticsearch;
            return api;
        });
};
