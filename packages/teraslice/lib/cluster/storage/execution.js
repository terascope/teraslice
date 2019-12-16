'use strict';

const {
    TSError, pRetry, includes, cloneDeep, isString
} = require('@terascope/utils');
const uuid = require('uuid');
const Promise = require('bluebird');
const { RecoveryCleanupType } = require('@terascope/job-components');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const elasticsearchBackend = require('./backends/elasticsearch_store');

const INIT_STATUS = ['pending', 'scheduling', 'initializing'];
const RUNNING_STATUS = ['recovering', 'running', 'failing', 'paused', 'stopping'];
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

    async function create(record, status = 'pending') {
        if (!_isValidStatus(status)) {
            throw new Error(`Unknown status "${status}" on execution create`);
        }
        const date = new Date();
        record.ex_id = uuid.v4();
        record.metadata = {};
        record._status = status;
        record._context = jobType;
        record._created = date;
        record._updated = date;

        try {
            await backend.create(record);
        } catch (err) {
            throw new TSError(err, {
                reason: 'Failure to create execution context'
            });
        }
        return record;
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

    async function getMetadata(exId) {
        if (!exId || !isString(exId)) {
            throw new Error('Missing execution ID');
        }
        const ex = await getExecution(exId);
        return ex.metadata || {};
    }

    async function updateMetadata(exId, metadata = {}) {
        if (!exId || !isString(exId)) {
            throw new Error('Missing execution ID');
        }
        return update(exId, { metadata });
    }

    function _addMetadataFns() {
        if (!context.apis.executionContext) return;

        context.apis.executionContext._getMetadata = getMetadata;
        context.apis.executionContext._updateMetadata = updateMetadata;
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

                // if it is set to stop but the execution finishes before it can stop
                // it is okay to set it to completed
                if (status === 'stopped' && desiredStatus === 'completed') {
                    return Promise.resolve(status);
                }

                // when the status is a terminal status, it cannot be set to again
                if (_isTerminalStatus(status)) {
                    const error = new TSError(`Cannot update terminal job status of "${status}" to "${desiredStatus}"`, {
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

    function _canRecover(ex) {
        if (!ex) {
            throw new Error('Unable to find execution to recover');
        }
        if (ex._status === 'completed') {
            throw new Error('This job has completed and can not be restarted.');
        }
        if (ex._status === 'scheduling' || ex._status === 'pending') {
            throw new Error('This job is currently being scheduled and can not be restarted.');
        }
        if (ex._status === 'running') {
            throw new Error('This job is currently successfully running and can not be restarted.');
        }
    }

    function _removeMetaData(execution) {
        // we need a better story about what is meta data
        delete execution.ex_id;
        delete execution._created;
        delete execution._updated;
        delete execution._status;
        delete execution.slicer_hostname;
        delete execution.slicer_port;
        delete execution._has_errors;
        delete execution._slicer_stats;
        delete execution._failureReason;
        delete execution.recovered_execution;
        delete execution.recovered_slice_type;
        delete execution._failureReason;

        execution.operations = execution.operations.map((opConfig) => {
            if (opConfig._op === 'elasticsearch_reader') {
                if (Array.isArray(opConfig.interval)) opConfig.interval = opConfig.interval.join('');
            }
            return opConfig;
        });
    }

    /**
     * We shouldn't be dependant on mutating the record
    */
    async function createRecoveredExecution(execution, cleanupType) {
        const _execution = cloneDeep(execution);
        if (cleanupType && !RecoveryCleanupType[cleanupType]) {
            throw new Error(`Unknown cleanup type "${cleanupType}" to recover`);
        }

        _canRecover(execution);
        _removeMetaData(execution);

        execution.recovered_execution = _execution.ex_id;
        if (cleanupType) {
            execution.recovered_slice_type = cleanupType;
        }

        const ex = await create(execution);
        return ex;
    }

    const api = {
        get: getExecution,
        search,
        create,
        update,
        remove,
        shutdown,
        createRecoveredExecution,
        getTerminalStatuses,
        getRunningStatuses,
        getLivingStatuses,
        setStatus,
        getStatus,
        getMetadata,
        updateMetadata,
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
            _addMetadataFns(context);
            return api;
        });
};
