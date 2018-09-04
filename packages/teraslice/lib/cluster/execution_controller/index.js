'use strict';

const Promise = require('bluebird');
const parseError = require('@terascope/error-parser');
const messageModule = require('../services/messaging');

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
    messaging.register({ event: 'process:SIGTERM', callback: executionShutdown });
    messaging.register({ event: 'process:SIGINT', callback: executionShutdown });

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
            return Promise.reject(`Slicer for ex_id: ${exId} runtime error led to a restart, terminating execution with failed status, please use the recover api to return slicer to a consistent state`);
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

    function terminalShutdown(errObj) {
        const errMsg = errObj.error || parseError(errObj);
        logger.error(`Terminal error: shutting down execution ${exId}, error: ${errMsg}`);

        // exStore may not be initialized, must rely on CM
        messaging.send({
            to: 'cluster_master',
            message: 'execution:error:terminal',
            error: errMsg,
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
                const errMsg = parseError(err);
                logger.error(`Error while attempting to shutdown execution_controller ex_id: ${exId}, error: ${errMsg}`);
                return logger.flush();
            })
            .finally(process.exit);
    }
};
