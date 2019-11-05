'use strict';


const {
    TSError,
    pRetry,
    get,
    includes
} = require('@terascope/utils');
const uuid = require('uuid');
const Promise = require('bluebird');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const elasticsearchBackend = require('./backends/elasticsearch_store');

const INIT_STATUS = ['pending', 'scheduling', 'initializing'];
const RUNNING_STATUS = ['running', 'failing', 'paused', 'stopping'];
const TERMINAL_STATUS = ['completed', 'stopped', 'rejected', 'failed', 'terminated'];

const VALID_STATUS = INIT_STATUS.concat(RUNNING_STATUS).concat(TERMINAL_STATUS);

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function executionStorage(context) {
    const logger = makeLogger(context, 'ex_storage');
    const config = context.sysconfig.teraslice;
    const jobType = 'ex';
    const indexName = `${config.name}__ex`;

    let backend;

    async function getExecution(exId) {
        if (!exId) throw new Error('Execution.get() requires a exId');
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

    async function getStatus(exId) {
        try {
            const result = await getExecution(exId);
            return result._status;
        } catch (err) {
            throw new TSError(err, {
                reason: `Cannot get execution status ${exId}`
            });
        }
    }

    // verify the current status to make sure it can be updated to the desired status
    function verifyStatusUpdate(exId, desiredStatus) {
        if (!desiredStatus || !_isValidStatus(desiredStatus)) {
            const error = new Error(`Invalid Job status: "${desiredStatus}"`);
            error.statusCode = 422;
            return Promise.reject(error);
        }

        return getStatus(exId)
            .then((status) => {
                // when setting the same status to shouldn't throw an error
                if (desiredStatus === status) {
                    return Promise.resolve();
                }

                // when the current status is running it cannot be set to an init status
                if (_isRunningStatus(status) && _isInitStatus(desiredStatus)) {
                    const error = new TSError(`Cannot update running job status of "${status}" to init status of "${desiredStatus}"`, {
                        statusCode: 422
                    });
                    return Promise.reject(error);
                }

                // when the status is a terminal status, it cannot be set to again
                if (_isTerminalStatus(status)) {
                    const error = new TSError(`Cannot update terminal job status of "${status}" to "${desiredStatus}"`, {
                        context: {
                            isOkay: status === 'stopped' && desiredStatus === 'completed'
                        },
                        statusCode: 422
                    });
                    return Promise.reject(error);
                }

                // otherwise allow the update
                return Promise.resolve(status);
            });
    }

    async function setStatus(exId, status, metaData) {
        await waitForClient();
        await pRetry(() => verifyStatusUpdate(exId, status), {
            matches: ['no_shard_available_action_exception'],
            delay: 1000,
            retries: 10,
            backoff: 5
        });

        try {
            const statusObj = { _status: status };
            if (metaData) {
                Object.assign(statusObj, metaData);
            }
            await update(exId, statusObj);
        } catch (err) {
            const isOkay = get(err, 'context.isOkay', false);
            if (isOkay) {
                logger.warn(err.message);
                return exId;
            }
            throw new TSError(err, {
                statusCode: 422,
                reason: `Unable to set execution ${exId} status code to ${status}`
            });
        }

        return exId;
    }

    function remove(exId) {
        return backend.remove(exId);
    }

    function shutdown(forceShutdown) {
        logger.info('shutting down.');
        return backend.shutdown(forceShutdown);
    }

    function verifyClient() {
        return backend.verifyClient();
    }

    function waitForClient() {
        return backend.waitForClient();
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
        return includes(VALID_STATUS, status);
    }

    function _isRunningStatus(status) {
        return includes(RUNNING_STATUS, status);
    }

    function _isTerminalStatus(status) {
        return includes(TERMINAL_STATUS, status);
    }

    function _isInitStatus(status) {
        return includes(INIT_STATUS, status);
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
        waitForClient,
        verifyClient,
    };

    const backendConfig = {
        context,
        indexName,
        recordType: 'ex',
        idField: 'ex_id',
        fullResponse: false,
        logRecord: false,
        storageName: 'execution'
    };

    return elasticsearchBackend(backendConfig)
        .then((elasticsearch) => {
            logger.info('execution storage initialized');
            backend = elasticsearch;
            return api;
        });
};
