'use strict';

const {
    TSError, pRetry, includes, cloneDeep, isString, getTypeOf, makeISODate
} = require('@terascope/utils');
const uuid = require('uuid/v4');
const { RecoveryCleanupType } = require('@terascope/job-components');
const { makeLogger } = require('../workers/helpers/terafoundation');
const elasticsearchBackend = require('./backends/elasticsearch_store');

const INIT_STATUS = ['pending', 'scheduling', 'initializing'];
const RUNNING_STATUS = ['recovering', 'running', 'failing', 'paused', 'stopping'];
const TERMINAL_STATUS = ['completed', 'stopped', 'rejected', 'failed', 'terminated'];

const VALID_STATUS = INIT_STATUS.concat(RUNNING_STATUS).concat(TERMINAL_STATUS);

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = async function executionStorage(context) {
    const logger = makeLogger(context, 'ex_storage');
    const config = context.sysconfig.teraslice;
    const jobType = 'ex';
    const indexName = `${config.name}__ex`;

    const backendConfig = {
        context,
        indexName,
        recordType: 'ex',
        idField: 'ex_id',
        fullResponse: false,
        logRecord: false,
        storageName: 'execution'
    };

    const backend = await elasticsearchBackend(backendConfig);

    async function getExecution(exId) {
        if (!exId) throw new Error('Execution.get() requires a exId');
        return backend.get(exId);
    }

    // encompasses all executions in either initialization or running statuses
    async function getActiveExecution(exId) {
        const str = getTerminalStatuses().map((state) => ` _status:${state} `).join('OR');
        const query = `ex_id:"${exId}" NOT (${str.trim()})`;
        const executions = await search(query, null, 1, '_created:desc');
        if (!executions.length) {
            throw new Error(`no active execution context was found for ex_id: ${exId}`, {
                statusCode: 404
            });
        }
        return executions[0];
    }

    async function search(query, from, size, sort) {
        let _size = 10000;
        if (size == null) _size = size;
        return backend.search(query, from, _size, sort);
    }

    async function create(record, status = 'pending') {
        if (!_isValidStatus(status)) {
            throw new Error(`Unknown status "${status}" on execution create`);
        }
        if (!record.job_id) {
            throw new Error('Missing job_id on execution create');
        }

        const date = makeISODate();
        const doc = Object.assign({}, record, {
            ex_id: uuid(),
            metadata: {},
            _status: status,
            _context: jobType,
            _created: date,
            _updated: date
        });
        try {
            await backend.create(doc);
        } catch (err) {
            throw new TSError(err, {
                reason: 'Failure to create execution context'
            });
        }
        return doc;
    }

    function updatePartial(exId, updateSpec) {
        return backend.update(exId, Object.assign(
            {},
            updateSpec,
            {
                ex_id: exId,
                _context: jobType,
                _updated: makeISODate()
            }
        ));
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
        return updatePartial(exId, { metadata });
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
    async function verifyStatusUpdate(exId, desiredStatus) {
        if (!desiredStatus || !_isValidStatus(desiredStatus)) {
            throw new TSError(`Invalid Job status: "${desiredStatus}"`, {
                statusCode: 422
            });
        }

        const status = await getStatus(exId);
        // when setting the same status to shouldn't throw an error
        if (desiredStatus === status) {
            return status;
        }
        // when the current status is running it cannot be set to an init status
        if (_isRunningStatus(status) && _isInitStatus(desiredStatus)) {
            throw new TSError(`Cannot update running job status of "${status}" to init status of "${desiredStatus}"`, {
                statusCode: 422
            });
        }
        // if it is set to stop but the execution finishes before it can stop
        // it is okay to set it to completed
        if (status === 'stopped' && desiredStatus === 'completed') {
            return status;
        }
        // when the status is a terminal status, it cannot be set to again
        if (_isTerminalStatus(status)) {
            throw new TSError(`Cannot update terminal job status of "${status}" to "${desiredStatus}"`, {
                statusCode: 422
            });
        }

        // otherwise allow the update
        return status;
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
            await updatePartial(exId, statusObj);
        } catch (err) {
            throw new TSError(err, {
                statusCode: 422,
                reason: `Unable to set execution ${exId} status code to ${status}`
            });
        }

        return exId;
    }

    async function remove(exId) {
        return backend.remove(exId);
    }

    async function shutdown(forceShutdown) {
        logger.info('shutting down.');
        return backend.shutdown(forceShutdown);
    }

    function verifyClient() {
        return backend.verifyClient();
    }

    async function waitForClient() {
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
        if (['running', 'recovering'].includes(ex._status)) {
            throw new Error(`This job is currently ${ex._status} and can not be restarted.`);
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
    }

    /**
     * @param {import('@terascope/job-components').ExecutionConfig} recoverFrom
     * @param {RecoveryCleanupType} [cleanupType]
     * @returns {Promise<import('@terascope/job-components').ExecutionConfig>}
    */
    async function createRecoveredExecution(recoverFrom, cleanupType) {
        if (!recoverFrom) {
            throw new Error(`Invalid execution given, got ${getTypeOf(recoverFrom)}`);
        }
        if (!recoverFrom.ex_id) {
            throw new Error('Unable to recover execution with missing ex_id');
        }
        const recoverFromId = recoverFrom.ex_id;

        const ex = cloneDeep(recoverFrom);
        if (cleanupType && !RecoveryCleanupType[cleanupType]) {
            throw new Error(`Unknown cleanup type "${cleanupType}" to recover`);
        }

        _canRecover(ex);
        _removeMetaData(ex);

        ex.previous_execution = recoverFromId;
        ex.recovered_execution = recoverFromId;
        if (cleanupType) {
            ex.recovered_slice_type = cleanupType;
        } else if (ex.autorecover) {
            ex.recovered_slice_type = RecoveryCleanupType.pending;
        }

        return create(ex);
    }

    logger.info('execution storage initialized');
    _addMetadataFns(context);
    return {
        get: getExecution,
        search,
        create,
        updatePartial,
        remove,
        shutdown,
        createRecoveredExecution,
        getActiveExecution,
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
};
