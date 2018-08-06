'use strict';

const Promise = require('bluebird');
const VError = require('verror');
const messageModule = require('../services/messaging');
const { logError } = require('../../utils/error_utils');

module.exports = function module(contextConfig) {
    const context = contextConfig;
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'execution_controller', ex_id: exId, job_id: jobId });
    const messaging = messageModule(context, logger);
    let assetStore;
    let exStore;
    let stateStore;
    let engine;

    // to catch signal propagation, but cleanup through msg sent from master
    messaging.register({ event: 'process:SIGTERM', callback: () => {} });
    messaging.register({ event: 'process:SIGINT', callback: () => {} });
    messaging.register({ event: 'worker:shutdown', callback: executionShutdown });


    events.on('client:initialization:error', terminalShutdown);
    // emitted after final cleanup of execution is complete
    events.on('execution:shutdown', () => process.exit());

    initializeExecutionController();

    // failure scenario inside engineInit is self contained inside engine
    function initializeExecutionController() {
        Promise.resolve(executionControllerInit())
            .then((_engine) => {
                engine = _engine;
                engine.initialize();
            })
            .catch(terminalShutdown);
    }

    function executionControllerInit() {
        // if slicer has restart by itself, terminate execution, need to wait for registration
        // of process message functions before we can send this message
        if (process.env.__process_restart) {
            return Promise.reject(new Error(`Slicer for ex_id: ${exId} runtime error led to a restart, terminating execution with failed status, please use the recover api to return slicer to a consistent state`));
        }
        // assets store is required so it can register apis before executionRunner
        // is called in engine
        return Promise.all([require('../storage/assets')(context), require('../storage/state')(context), require('../storage/execution')(context)])
            .spread((_assetStore, _stateStore, _exStore) => {
                logger.trace('stateStore and jobStore for slicer has been initialized');
                assetStore = _assetStore;
                stateStore = _stateStore;
                exStore = _exStore;
                return require('./engine')(context, messaging, exStore, stateStore);
            });
    }

    function terminalShutdown(err) {
        const error = new VError({
            name: 'TerminalError',
            cause: err,
            info: {
                ex_id: exId,
                job_id: jobId,
            }
        }, 'shutting down execution %s', exId);
        logError(logger, error);

        // exStore may not be initialized, must rely on CM
        return messaging.send({
            to: 'cluster_master',
            message: 'execution:error:terminal',
            error: error.toString(),
            ex_id: exId
        });
    }

    function executionShutdown() {
        const shutdownSequence = [];
        if (assetStore) shutdownSequence.push(assetStore.shutdown());
        if (stateStore) shutdownSequence.push(stateStore.shutdown());
        if (exStore) shutdownSequence.push(exStore.shutdown());
        if (engine) shutdownSequence.push(engine.shutdown());

        Promise.all(shutdownSequence)
            .then(logger.flush)
            .catch((err) => {
                const error = new VError(err, 'failure while attempting to shutdown execution_controller ex_id: %s', exId);
                logError(logger, error);
                return logger.flush();
            })
            .finally(process.exit);
    }
};
