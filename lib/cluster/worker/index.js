'use strict';

const Promise = require('bluebird');
const parseError = require('error_parser');
const messagingFn = require('../services/messaging');

module.exports = function module(context) {
    const events = context.apis.foundation.getSystemEvents();
    const cluster = context.cluster;
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const ID = `${context.sysconfig.teraslice.hostname}__${cluster.worker.id}`;
    const executionRunner = require('../runners/execution')(context);

    const logger = context.apis.foundation.makeLogger({
        ex_id: exId,
        job_id: jobId,
        module: 'worker_process',
        worker_id: ID
    });
    // need ipc channels open before job construction
    const messaging = messagingFn(context, logger);

    // if worker cannot make client, job needs to shutdown, needs to be setup before executionRunner
    events.on('client:initialization:error', terminalShutdown);

    messaging.register({ event: 'process:SIGTERM', callback: () => {} });
    messaging.register({ event: 'process:SIGINT', callback: () => {} });


    function initializeWorker() {
        // assets store is loaded so it can register under context.apis
        return Promise.resolve(require('../storage/assets')(context))
            .then(() => Promise.all([
                executionRunner.initialize(events, logger),
                require('../storage/state')(context),
                require('../storage/analytics')(context)
            ]))
            .spread((executionContext, stateStore, analyticsStore) => require('./executor')(context, messaging, executionContext, stateStore, analyticsStore))
            .catch((err) => {
                const errMsg = `worker: ${ID} could not instantiate for execution: ${exId}, error: ${parseError(err)}`;
                logger.error(errMsg);

                // TODO rename message sent to be more semantically correct
                messaging.send({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: exId,
                    error: errMsg
                })
                    .then(() => logger.flush())
                    .then(() => process.exit())
                    .catch((flushErr) => {
                        const flushErrMsg = parseError(flushErr);
                        logger.error(flushErrMsg);
                        process.exit();
                    });
            });
    }

    // TODO stick store shutdown logic out here

    function terminalShutdown(errEV) {
        logger.error(`Terminal error, shutting down execution ${exId}`);
        events.emit('worker:shutdown');
        messaging.respond({ message: 'execution:error:terminal', error: errEV.error, ex_id: exId });
    }

    initializeWorker();
};
