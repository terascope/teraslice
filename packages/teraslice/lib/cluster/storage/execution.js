'use strict';


const uuid = require('uuid');
const Promise = require('bluebird');
const _ = require('lodash');

const INIT_STATUS = ['pending', 'scheduling', 'initializing'];
const RUNNING_STATUS = ['running', 'failing', 'paused'];
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
        if (!exId) return Promise.reject(new Error('Execution.get() requires a exId'));
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

    function getStatus(exId) {
        return getExecution(exId)
            .then(result => result._status)
            .catch((err) => {
                const error = new Error(`Cannot get execution status ${exId}, caused by ${err.toString()}`);
                return Promise.reject(error);
            });
    }

    // verify the current status to make sure it can be updated to the desired status
    function verifyStatusUpdate(exId, desiredStatus) {
        if (!desiredStatus || !_isValidStatus(desiredStatus)) {
            return Promise.reject(new Error(`Invalid Job status: "${desiredStatus}"`));
        }


        return getStatus(exId)
            .then((status) => {
                // when setting the same status to shouldn't throw an error and allow the metadata to be updated again
                if (desiredStatus === status) {
                    return Promise.resolve();
                }

                // when the current status is running it cannot be set to an init status
                if (_isRunningStatus(status) && _isInitStatus(desiredStatus)) {
                    const error = new Error(`Cannot update running job status of "${status}" to init status of "${desiredStatus}"`);
                    return Promise.reject(error);
                }

                // when the status is a terminal status, it cannot be set to again
                if (_isTerminalStatus(status)) {
                    const error = new Error(`Cannot update terminal job status of "${status}" to "${desiredStatus}"`);
                    return Promise.reject(error);
                }

                // otherwise allow the update
                return Promise.resolve(status);
            });
    }

    function setStatus(exId, status, metaData) {
        return verifyStatusUpdate(exId, status)
            .then(() => {
                const statusObj = { _status: status };
                if (metaData) {
                    _.assign(statusObj, metaData);
                }
                return update(exId, statusObj);
            })
            .then(() => exId)
            .catch((err) => {
                const error = _.isString(err) ? new Error(err) : err;
                logger.error(`Unable to set execution ${exId} status code to ${status}`, error);
                return error;
            });
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
        return _.includes(VALID_STATUS, status);
    }

    function _isRunningStatus(status) {
        return _.includes(RUNNING_STATUS, status);
    }

    function _isTerminalStatus(status) {
        return _.includes(TERMINAL_STATUS, status);
    }

    function _isInitStatus(status) {
        return _.includes(INIT_STATUS, status);
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
        getStatus,
        executionMetaData,
        verifyStatusUpdate,
    };

    return require('./backends/elasticsearch_store')(context, jobsIndex, 'ex', 'ex_id')
        .then((elasticsearch) => {
            logger.info('Initializing');
            backend = elasticsearch;
            return api;
        });
};
