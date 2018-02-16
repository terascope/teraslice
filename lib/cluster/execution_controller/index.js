'use strict';

const Promise = require('bluebird');
const parseError = require('error_parser');
const messageModule = require('../services/messaging');


module.exports = function module(contextConfig) {
    const context = contextConfig;
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const executionRunner = require('../runners/execution')(context);
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'execution_controller', ex_id: exId, job_id: jobId });
    const messaging = messageModule(context, logger);
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
        Promise.resolve(executionInit())
            .catch(terminalShutdown);
    }

    function executionInit() {
        // if slicer has restart by itself, terminate execution, need to wait for registration
        // of process message functions before we can send this message
        if (process.env.__process_restart) {
            return Promise.reject(`Slicer for ex_id: ${exId} runtime error led to a restart, terminating execution with failed status, please use the recover api to return slicer to a consistent state`);
        }
        // assets store is loaded first so it can register apis before executionRunner is called
        return Promise.resolve(require('../storage/assets')(context))
            .then(() => Promise.all([
                require('../storage/state')(context),
                require('../storage/execution')(context)
            ]))
            .spread((_stateStore, _exStore) => {
                logger.trace('stateStore and jobStore for slicer has been initialized');
                stateStore = _stateStore;
                exStore = _exStore;
                engine = require('./engine')(context, messaging, exStore, stateStore, executionRunner);
console.log("Attempting to send message from slicer")
                // TODO: this should really be synchronized to the loading of the engine.
                messaging.send({ to: 'node_master', message: 'worker:online', ex_id: exId });
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
