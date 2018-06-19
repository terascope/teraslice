'use strict';

const Promise = require('bluebird');
const parseError = require('@terascope/error-parser');
const _ = require('lodash');
const messagingFn = require('../services/messaging');

module.exports = function module(context) {
    const events = context.apis.foundation.getSystemEvents();
    const { cluster } = context;
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const ID = `${context.sysconfig.teraslice.hostname}__${cluster.worker.id}`;

    const logger = context.apis.foundation.makeLogger({
        ex_id: exId,
        job_id: jobId,
        module: 'worker_process',
        worker_id: ID
    });
    // need ipc channels open before job construction
    const messaging = messagingFn(context, logger);
    const shutdown = _.once(processShutdown);

    let assetStore;
    let stateStore;
    let analyticsStore;
    let executor;

    // if worker cannot make client, job needs to shutdown, needs to be setup before executionRunner
    events.on('client:initialization:error', terminalShutdown);

    messaging.register({ event: 'process:SIGTERM', callback: () => {} });
    messaging.register({ event: 'process:SIGINT', callback: () => {} });
    messaging.register({ event: 'worker:shutdown', callback: shutdown });

    events.on('worker:recycle', shutdown);

    function initializeWorker() {
        // assets store is loaded so it can register under context.apis
        return Promise.resolve()
            .then(() => Promise.all([
                require('../storage/assets')(context),
                require('../storage/state')(context),
                require('../storage/analytics')(context)
            ]))
            .spread((_assetStore, _stateStore, _analyticsStore) => {
                assetStore = _assetStore;
                stateStore = _stateStore;
                analyticsStore = _analyticsStore;
                executor = require('./executor')(context, messaging, stateStore, analyticsStore);
                return executor.initialize();
            })
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
                    .then(() => process.exit(0))
                    .catch((flushErr) => {
                        const flushErrMsg = parseError(flushErr);
                        logger.error(flushErrMsg);
                        logger.flush().then(() => {
                            process.exit(1);
                        });
                    });
            });
    }

    function terminalShutdown(errEV) {
        logger.error(`Terminal error, shutting down execution ${exId}`);
        events.emit('worker:shutdown');
        messaging.respond({ message: 'execution:error:terminal', error: errEV.error, ex_id: exId });
    }

    function processShutdown() {
        const shutdownSequence = [];
        if (assetStore) shutdownSequence.push(assetStore.shutdown());
        if (stateStore) shutdownSequence.push(stateStore.shutdown());
        if (analyticsStore) shutdownSequence.push(analyticsStore.shutdown());
        if (executor) shutdownSequence.push(executor.shutdown());

        Promise.all(shutdownSequence)
            .then(() => logger.flush().then(() => {
                process.exit(0);
            }))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Error while attempting to shutdown worker ${ID}, error: ${errMsg}`);
                logger.flush();
                setTimeout(() => {
                    process.exit(1);
                }, 100);
            });
    }

    initializeWorker();
};
