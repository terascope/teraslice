'use strict';

const {
    TSError, includes, getTypeOf, makeISODate
} = require('@terascope/utils');
const { v4: uuid } = require('uuid');
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

    async function search(query, from, size, sort, fields) {
        return backend.search(query, from, size, sort, fields);
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
            _updated: date,
            _has_errors: false,
            _slicer_stats: {},
            _failureReason: ''
        });

        delete doc.slicer_port;
        delete doc.slicer_hostname;

        try {
            await backend.create(doc);
        } catch (err) {
            throw new TSError(err, {
                reason: 'Failure to create execution context'
            });
        }
        return doc;
    }

    async function updatePartial(exId, applyChanges) {
        return backend.updatePartial(exId, applyChanges);
    }

    /**
     * @typedef ExErrorMetadata
     * @property _has_errors {boolean}
     * @property _failureReason {string}
     * @property _slicer_stats {import(
     *  '../workers/execution-controller/execution-analytics.js'
     * ).ExecutionStats}
     */

    /**
     * Format the execution error stats, primarly used for updating the
     * status.
     *
     * If no error message is passed, it will reset the _has_errors and _failureReason.
     * If execution stats is provided it will set the _slicer_stats
     *
     * @param stats {import(
     *  '../workers/execution-controller/execution-analytics.js'
     * ).ExecutionStats=}
     * @param errMsg {string=}
     * @return {ExErrorMetadata}
    */
    function executionMetaData(stats, errMsg) {
        const errMetadata = {
            _has_errors: false,
            _failureReason: ''
        };
        const statsMetadata = {};

        if (errMsg) {
            errMetadata._has_errors = true;
            errMetadata._failureReason = errMsg;
        }

        if (stats) {
            statsMetadata._slicer_stats = Object.assign({}, stats);
        }

        return Object.assign({}, errMetadata, statsMetadata);
    }

    async function getMetadata(exId) {
        const ex = await getExecution(exId);
        return ex.metadata || {};
    }

    async function updateMetadata(exId, metadata = {}) {
        await backend.update(exId, {
            metadata,
            _updated: makeISODate()
        });
    }

    function _addMetadataFns() {
        if (!context.apis.executionContext) return;
        context.apis.executionContext.registerMetadataFns(
            { get: getMetadata, update: updateMetadata }
        );
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
        _verifyStatus(status, desiredStatus);
    }

    function _verifyStatus(status, desiredStatus) {
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

    /**
     * Set the status
     *
     * @param {string} exId
     * @param {string} status
     * @param {Partial<import('@terascope/job-components').ExecutionConfig>} body
     * @returns {Promise<import('@terascope/job-components').ExecutionConfig>}
    */
    async function setStatus(exId, status, body) {
        try {
            return await updatePartial(exId, (existing) => {
                _verifyStatus(existing._status, status);
                return Object.assign(existing, body, {
                    _status: status,
                    _updated: makeISODate()
                });
            });
        } catch (err) {
            throw new TSError(err, {
                statusCode: 422,
                reason: `Unable to set execution ${exId} status code to ${status}`
            });
        }
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

        const ex = Object.assign({}, recoverFrom);
        if (cleanupType && !RecoveryCleanupType[cleanupType]) {
            throw new Error(`Unknown cleanup type "${cleanupType}" to recover`);
        }

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
