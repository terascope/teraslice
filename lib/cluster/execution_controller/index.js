'use strict';

const Promise = require('bluebird');
const statContainer = require('../../utils/analytics').statContainer;
const addStats = require('../../utils/analytics').addStats;
const parseError = require('error_parser');
const messageModule = require('../services/messaging');


module.exports = function module(contextConfig) {
    let context = contextConfig;
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const jobRunner = require('../runners/execution')(context);
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'execution_controller', ex_id: exId, job_id: jobId });
    const messaging = messageModule(context, logger);
    const executionModules = { context, messaging };

    let workerFound = false;
    let isShuttingDown = false;
    let job;
    let slicer;
    let analyticsData;
    let stateStore;
    let exStore;
    // mocking since shutdown could be called before its instantiated
    let executionAnalytics = { shutdown: () => {} };
    let engine = { shutdown: () => {} };
    let recovery;

    /*
     Main logic
     _______________________________________________________
     */

    // events can be fired from anything that instantiates a client, such as stores and slicers
    // needs to be setup before jobRunner
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
            workerFound = true;
            logger.info(`worker: ${workerId} has joined slicer: ${exId}`);
            executionAnalytics.increment('workers_joined');
            // if there are more clients than the length of the queue, increase the queue size
            engine.adjustQueueLength();
            engine.enqueueWorker(msg.payload);
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
                    addStats(analyticsData, sliceData.analytics);
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

    // TODO: review this
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

            // only call if workers have connected before, and there are none left
            if (!isShuttingDown && workerFound && messaging.getClientCounts() === 0) {
                // TODO this needs a refactor for when slicer controls ex state
                // TODO this does not work, message handler does not exist for whats being sent
                setTimeout(() => {
                    // if after a a set time there are still no workers, it will shutdown
                    if (messaging.getClientCounts() === 0) {
                        messaging.send({
                            to: 'cluster_master',
                            message: 'slicer:error:terminal',
                            error: `all workers from slicer #${exId} have disconnected`,
                            ex_id: exId
                        });
                    }
                }, context.sysconfig.teraslice.worker_disconnect_timeout);
            }
        }
    });

    events.on('slicer:job:update', (data) => {
        logger.debug('slicer sending a execution update', data.update);
        // this is updating the opConfig for elasticsearch start and/or end dates for ex,
        // this assumes elasticsearch is first
        exStore.update(exId, { operations: data.update });
    });

    events.once('slice:failure', () => {
        logger.error(`slicer: ${exId} has encountered a processing_error`);
        const slicerAnalytics = executionAnalytics.getAnalytics();
        const errorMeta = exStore.failureMeta(null, slicerAnalytics);
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
        console.log('what slicer ', slicers);
        engine.registerSlicers(slicers);
    }

    function executionInit() {
        // if slicer has restart by itself, terminate execution, need to wait for registration
        // of process message functions before we can send this message
        const slicerTimeout = context.sysconfig.teraslice.slicer_timeout;

        if (process.env.__process_restart) {
            // TODO need to restart slicer and make all recoverable
            return Promise.reject(`Slicer for ex_id: ${exId} runtime error led to a restart, terminating execution with failed status, please use the recover api to return slicer to a consistent state`);
        }

        return Promise.resolve(require('../storage/assets')(context))
            // assets store is loaded so it can register under context.apis
            .then(() => jobRunner.initialize(events, logger))
            .then((_job) => {
                executionModules.execution = _job;
                job = _job;
                slicer = _job.slicer;
                analyticsData = statContainer(_job.jobs);
                return Promise.all([require('../storage/state')(context), require('../storage/execution')(context)]);
            })
            .spread((stateStorage, exStorage) => {
                stateStore = stateStorage;
                exStore = exStorage;
                executionModules.stateStore = stateStorage;
                executionModules.exStore = exStorage;
                logger.trace('stateStore and job_store for slicer has been initialized');

                executionAnalytics = require('./analytics')(context, messaging);
                executionModules.executionAnalytics = executionAnalytics;
                recovery = require('./recovery')(executionModules);
                executionModules.recovery = recovery;
                engine = require('./engine')(executionModules);
                engine.setQueueLength(job);

                messaging.initialize({ port: job.config.slicer_port });
                engine.initialize();

                // if no worker has attached in allotted time, shutdown execution
                setTimeout(() => {
                    if (!workerFound) {
                        logger.error(`A worker has not connected to a slicer for ex: ${exId}, shutting down execution`);
                        const slicerAnalytics = executionAnalytics.getAnalytics();
                        const errorMeta = exStore.failureMeta(`No workers have connected to slicer in the allotted time: ${slicerTimeout} ms`, slicerAnalytics);
                        exStore.setStatus(exId, 'failed', errorMeta)
                            .then(() => {
                                messaging.send({
                                    to: 'cluster_master',
                                    message: 'execution:error:terminal',
                                    ex_id: exId
                                });
                            });
                    }
                }, slicerTimeout);

                return true;
            })
            .catch((err) => {
                logger.error(`Slicer: failure during initialization for execution ${exId}`);
                const errMsg = parseError(err);
                logger.error(errMsg);
                // exStore may not be instantiated, need to rely on CM to mark execution as failed
                messaging.send({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    error: errMsg,
                    ex_id: exId
                });
            });
    }


    function executionRecovery() {
        const recoveredSlices = [];
        const numOfSlicersToRecover = job.config.slicers;
        const recoverExecution = process.env.recover_execution;

        return new Promise((resolve, reject) => {
            if (recoverExecution) {
                logger.info(`execution: ${exId} is starting in recovery mode`);
                recovery.initialize();

                Promise.resolve(engine.recoverSlices(numOfSlicersToRecover))
                    .then(() => recovery.getSlicerStartingPosition(numOfSlicersToRecover))
                    .then(executionStartingPoints => resolve(executionStartingPoints))
                    .catch(err => reject(parseError(err)));
            } else {
                resolve(recoveredSlices);
            }
        });
    }

    function terminalError(err) {
        const errMsg = parseError(err);
        const slicerAnalytics = executionAnalytics.getAnalytics();
        const errorMeta = exStore.failureMeta(errMsg, slicerAnalytics);
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
        return slicer.newSlicer(context, job, retryDataList, logger);
    }

    function slicerInitRetry(slicerError) {
        const errMsg = parseError(slicerError);
        let times = 1;
        const maxRetries = job.maxRetries;
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

        events.emit('job:stop');
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

    /*
     Supporting functions
     ________________________________________________________________
     */

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
