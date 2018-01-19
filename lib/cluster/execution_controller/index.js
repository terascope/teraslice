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

    // to catch signal propagation, but cleanup through msg sent from master
    messaging.register({ event: 'process:SIGTERM', callback: () => {} });
    messaging.register({ event: 'process:SIGINT', callback: () => {} });

    events.on('client:initialization:error', terminalShutdown);
    // emitted after final cleanup of execution is complete
    events.on('execution:shutdown', () => process.exit());

    initializeExecutionController();

    // failure scenario inside engineInit is self contained inside engine
    function initializeExecutionController() {
        Promise.resolve(executionInit())
            .catch(terminalShutdown)
            .then(engine => engine.initialize())
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
            .then(() => Promise.all([executionRunner.initialize(events, logger), require('../storage/state')(context), require('../storage/execution')(context)]))
            .spread((executionContext, stateStore, exStore) => {
                logger.trace('stateStore and jobStore for slicer has been initialized');
                return require('./engine')(context, messaging, exStore, stateStore, executionContext);
            });
    }

    function terminalShutdown(errObj) {
        logger.error(`Terminal error: shutting down execution ${exId}`);
        const errMsg = errObj.error || parseError(errObj);
        // exStore may not be initialized, must rely on CM
        messaging.send({
            to: 'cluster_master',
            message: 'execution:error:terminal',
            error: errMsg,
            ex_id: exId
        });
    }
};
