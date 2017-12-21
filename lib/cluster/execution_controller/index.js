'use strict';

const Promise = require('bluebird');
const parseError = require('error_parser');
const messageModule = require('../services/messaging');


module.exports = function module(contextConfig) {
    let context = contextConfig;
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const executionRunner = require('../runners/execution')(context);
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'execution_controller', ex_id: exId, job_id: jobId });
    const messaging = messageModule(context, logger);
    const executionModules = { context, messaging };

    let workerFound = false;
    let isShuttingDown = false;
    let executionContext;
    let slicer;
    let stateStore;
    let exStore;
    // mocking modules since shutdown could be called before its instantiated
    let executionAnalytics = { shutdown: () => {} };
    let engine = { shutdown: () => {} };
    let slicerAnalytics;
    let recovery;

    // events can be fired from anything that instantiates a client, such as stores and slicers
    // needs to be setup before executionRunner
    messaging.register({ event: 'worker:shutdown', callback: executionShutdown });

    messaging.register({
        event: 'assets:loaded',
        callback: ipcMessage => events.emit('slicer:assets_loaded', ipcMessage)
    });

    messaging.register({
        event: 'cluster:execution:pause',
        callback: (msg) => {
            engine.pause();
            events.emit('execution:pause');
            messaging.respond(msg);
        }
    });

    messaging.register({
        event: 'cluster:execution:resume',
        callback: (msg) => {
            engine.resume();
            events.emit('execution:resume');
            messaging.respond(msg);
        }
    });


    // to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }
    // TODO see if this can be put in terafoundation
    messaging.register({ event: 'process:SIGTERM', callback: noOP });
    messaging.register({ event: 'process:SIGINT', callback: noOP });

    messaging.register({
        event: 'worker:ready',
        identifier: 'worker_id',
        callback: (msg, workerId) => {
            const workerOnlineData = msg.payload;
            workerFound = true;
            logger.info(`worker: ${workerId} has joined slicer: ${exId}`);
            executionAnalytics.increment('workers_joined');
            // if there are more clients than the length of the queue, increase the queue size
            engine.adjustQueueLength();
            engine.enqueueWorker(workerOnlineData);
        }
    });

    messaging.register({
        event: 'worker:slice:complete',
        identifier: 'worker_id',
        callback: (msg, workerId) => {
            const sliceData = msg.payload;
            executionAnalytics.increment('processed');
            // Need to join room if a restart happened
            if (sliceData.retry) {
                logger.warn(`worker: ${workerId} has rejoined slicer: ${exId}`);
                executionAnalytics.increment('workers_reconnected');
            }

            if (sliceData.error) {
                logger.error(`worker: ${workerId} has error on slice: ${JSON.stringify(sliceData)} , slicer: ${exId}`);
                executionAnalytics.increment('failed');
                events.emit('slice:failure', sliceData);
            } else {
                if (sliceData.analytics) {
                    slicerAnalytics.addStats(sliceData.analytics);
                }
                events.emit('slice:success', sliceData);
            }

            logger.debug(`worker ${workerId} has completed its slice,`, sliceData);

            // Report to worker that it has been reported, so it can remove reference to last slice
            messaging.send({
                to: 'worker',
                address: workerId,
                message: 'slicer:slice:recorded',
                payload: null
            });
            if (!sliceData.isShuttingDown) {
                engine.enqueueWorker(sliceData);
            }
        }
    });

    messaging.register({
        event: 'network:disconnect',
        identifier: 'worker_id',
        callback: (workerId) => {
            executionAnalytics.increment('workers_disconnected');
            logger.warn(`Worker: ${workerId} has disconnected`);
            // if there are less clients than the length of the queue, decrease the queue size
            engine.adjustQueueLength();
            engine.removeWorker(workerId);
            events.emit('network:disconnect', workerId);
            workerDisconnectWatchDog();
        }
    });

    events.on('slicer:execution:update', (data) => {
        logger.debug('slicer sending a execution update', data.update);
        // this is updating the opConfig for elasticsearch start and/or end dates for ex,
        // this assumes elasticsearch is first
        exStore.update(exId, { operations: data.update });
    });

    events.once('slice:failure', () => {
        logger.error(`slicer: ${exId} has encountered a processing_error`);
        const executionStats = executionAnalytics.getAnalytics();
        const errorMeta = exStore.failureMetaData(null, executionStats);
        exStore.setStatus(exId, 'failing', errorMeta);
    });

    events.on('getClient:config_error', terminalShutdown);


    initializeExecutionController();

    function initializeExecutionController() {
        Promise.resolve(executionInit())
            .then(executionRecovery)
            .catch(terminalError)
            .then(slicerInit)
            .catch(slicerInitRetry)
            .then(slicerEngine)
            .catch(terminalError);
    }

    function slicerEngine(slicers) {
        engine.registerSlicers(slicers);
    }

    function executionInit() {
        // if slicer has restart by itself, terminate execution, need to wait for registration
        // of process message functions before we can send this message
        if (process.env.__process_restart) {
            // TODO need to restart slicer and make all recoverable
            return Promise.reject(`Slicer for ex_id: ${exId} runtime error led to a restart, terminating execution with failed status, please use the recover api to return slicer to a consistent state`);
        }

        return Promise.resolve(require('../storage/assets')(context))
            // assets store is loaded so it can register under context.apis
            .then(() => executionRunner.initialize(events, logger))
            .then((_executionContext) => {
                executionModules.executionContext = _executionContext;
                executionContext = _executionContext;
                slicer = _executionContext.slicer;
                return Promise.all([require('../storage/state')(context), require('../storage/execution')(context)]);
            })
            .spread((stateStorage, exStorage) => {
                stateStore = stateStorage;
                exStore = exStorage;
                executionModules.stateStore = stateStorage;
                executionModules.exStore = exStorage;
                logger.trace('stateStore and jobStore for slicer has been initialized');

                executionAnalytics = require('./execution_analytics')(executionModules);
                executionModules.executionAnalytics = executionAnalytics;

                slicerAnalytics = require('./slice_analytics')(executionModules);
                executionModules.slicerAnalytics = slicerAnalytics;

                engine = require('./engine')(executionModules);
                executionModules.engine = engine;
                engine.setQueueLength(executionContext);

                recovery = require('./recovery')(executionModules);
                executionModules.recovery = recovery;

                messaging.initialize({ port: executionContext.config.slicer_port });
                engine.initialize();

                workerConnectionWatchDog();

                return true;
            });
    }


    function executionRecovery() {
        const recoveredSlices = [];
        const numOfSlicersToRecover = executionContext.config.slicers;
        const recoverExecution = process.env.recover_execution;

        return new Promise((resolve, reject) => {
            if (recoverExecution) {
                logger.info(`execution: ${exId} is starting in recovery mode`);
                recovery.initialize();

                Promise.resolve(recovery.recoverSlices(numOfSlicersToRecover))
                    .then(executionStartingPoints => resolve(executionStartingPoints))
                    .catch(err => reject(parseError(err)));
            } else {
                resolve(recoveredSlices);
            }
        });
    }

    function terminalError(err) {
        const errMsg = parseError(err);
        const executionStats = executionAnalytics.getAnalytics();
        const errorMeta = exStore.failureMetaData(errMsg, executionStats);
        logger.error(errMsg);

        exStore.setStatus(exId, 'failed', errorMeta)
            .then(() => {
                messaging.send({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: exId,
                    payload: { set_status: true }
                });
            });
    }


    function slicerInit(retryDataList) {
        // TODO breaking change, removed slicerAnalytics which was second to last param !!!!!!!!!
        return slicer.newSlicer(context, executionContext, retryDataList, logger);
    }

    function slicerInitRetry(slicerError) {
        const errMsg = parseError(slicerError);
        let times = 1;
        const maxRetries = executionContext.maxRetries;
        logger.error(`Error on slicer initialization, will attempt to retry ${maxRetries} times: ${errMsg}`);
        return new Promise(((resolve, reject) => {
            function retry() {
                slicerInit()
                    .then((slicers) => {
                        logger.info('slicer initialization was successful');
                        resolve(slicers);
                    })
                    .catch((err) => {
                        times += 1;
                        if (times < maxRetries) {
                            retry();
                        } else {
                            const retryErrMsg = parseError(err);
                            reject(`Could not initialize slicers, error: ${retryErrMsg}`);
                        }
                    });
            }

            retry();
        }));
    }

    function executionShutdown() {
        logger.info(`slicer for execution: ${exId} has received a shutdown notice`);
        isShuttingDown = true;
        engine.shutdown();
        executionAnalytics.shutdown();

        events.emit('execution:stop');
        Promise.resolve()
            .then(() => {
                if (stateStore) {
                    return stateStore.shutdown();
                }
                return true;
            })
            .then(() => logger.flush())
            .then(() => process.exit())
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(errMsg);
                process.exit();
            });
    }
    function watchDog(checkFn, timeout, errMsg, logMsg) {
        setTimeout(() => {
            // if after a a set time there are still no workers, it will shutdown
            if (checkFn()) {
                logger.error(logMsg);
                const executionStats = executionAnalytics.getAnalytics();
                const errorMetaData = exStore.failureMetaData(errMsg, executionStats);
                exStore.setStatus(exId, 'failed', errorMetaData)
                    .then(() => {
                        messaging.send({
                            to: 'cluster_master',
                            message: 'execution:error:terminal',
                            ex_id: exId,
                            payload: { set_status: true }
                        });
                    });
            }
        }, timeout);
    }

    function workerDisconnectWatchDog() {
        const checkFn = () => !isShuttingDown && workerFound && messaging.getClientCounts() === 0;
        const timeout = context.sysconfig.teraslice.worker_disconnect_timeout;
        const errMsg = `all workers from slicer #${exId} have disconnected`;

        watchDog(checkFn, timeout, errMsg, errMsg);
    }

    function workerConnectionWatchDog() {
        const checkFn = () => !workerFound;
        const timeout = context.sysconfig.teraslice.slicer_timeout;
        const errMsg = `No workers have connected to slicer in the allotted time: ${timeout} ms`;
        const logMsg = `A worker has not connected to a slicer for ex: ${exId}, shutting down execution`;

        watchDog(checkFn, timeout, errMsg, logMsg);
    }

    function terminalShutdown(errEV) {
        logger.error(`Terminal error: shutting down execution ${exId}`);
        // exStore may not be initialized, must rely on CM
        messaging.send({
            to: 'cluster_master',
            message: 'execution:error:terminal',
            error: errEV.err,
            ex_id: exId
        });
    }

    function testContext(tempContext) {
        if (tempContext) {
            context = tempContext;
        }

        return {};
    }

    return {
        __test_context: testContext
    };
};
