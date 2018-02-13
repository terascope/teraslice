'use strict';

const Queue = require('queue');
const uuid = require('uuid');
const dateFormat = require('../../utils/date_utils').dateFormat;
const parseError = require('error_parser');
const moment = require('moment');
const _ = require('lodash');

module.exports = function module(context, messaging, exStore, stateStore, executionContext) {
    const executionConfig = executionContext.config;
    const start = moment();
    const events = context.apis.foundation.getSystemEvents();
    let exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const logger = context.apis.foundation.makeLogger({ module: 'execution_engine', ex_id: exId, job_id: jobId });
    const slicerModule = executionContext.slicer;

    let executionAnalytics;
    let slicerAnalytics;
    let recovery;
    let testRecovery;

    const workerQueue = new Queue();
    const slicerQueue = new Queue();

    let scheduler;
    let engineFn;
    let engine;
    let engineCanRun = true;
    let slicerDone = 0;
    let totalSlicers = 0;
    let allSlicersDone = false;
    let dynamicQueueLength = false;
    let workerFound = false;
    let isShuttingDown = false;
    let queueLength;

    messaging.register({
        event: 'cluster:execution:pause',
        callback: (msg) => {
            _pause();
            events.emit('execution:pause');
            messaging.respond(msg);
        }
    });

    messaging.register({
        event: 'cluster:execution:resume',
        callback: (msg) => {
            _resume();
            events.emit('execution:resume');
            messaging.respond(msg);
        }
    });

    messaging.register({
        event: 'worker:ready',
        identifier: 'worker_id',
        callback: (msg, workerId) => {
            const workerOnlineData = msg.payload;
            workerFound = true;
            logger.info(`worker: ${workerId} has joined slicer: ${exId}`);
            executionAnalytics.increment('workers_joined');
            // if there are more clients than the length of the queue, increase the queue size
            _adjustSlicerQueueLength();
            events.emit('worker:ready', workerId);
            workerQueue.enqueue(workerOnlineData);
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
                workerQueue.enqueue(sliceData);
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
            _adjustSlicerQueueLength();
            workerQueue.remove(workerId);
            events.emit('network:disconnect', workerId);
            _startWorkerDisconnectWatchDog();
        }
    });

    // events can be fired from anything that instantiates a client, such as stores and slicers
    // needs to be setup before executionRunner
    messaging.register({ event: 'worker:shutdown', callback: _executionShutdown });

    messaging.register({
        event: 'assets:loaded',
        callback: ipcMessage => events.emit('execution:assets_loaded', ipcMessage)
    });

    events.on('slicer:execution:update', (data) => {
        logger.debug('slicer sending a execution update', data.update);
        // this is updating the opConfig for elasticsearch start and/or end dates for ex,
        // this assumes elasticsearch is first
        exStore.update(exId, { operations: data.update });
    });

    function _registerSlicers(slicersArray, isRecovery) {
        if (!Array.isArray(slicersArray)) {
            throw new Error(`newSlicer from module ${executionConfig.operations[0]._op} needs to return an array of slicers`);
        }
        totalSlicers = slicersArray.length;
        executionAnalytics.set('slicers', totalSlicers);
        scheduler = _getScheduler(slicersArray);

        // Recovery has it own error listening logic internally
        if (!isRecovery) {
            events.once('slice:failure', () => {
                logger.error(`slicer: ${exId} has encountered a processing_error`);
                const executionStats = executionAnalytics.getAnalytics();
                const errorMeta = exStore.failureMetaData(null, executionStats);
                exStore.setStatus(exId, 'failing', errorMeta);
            });
        }
    }

    function initialize() {
        return Promise.resolve()
            .then(_engineSetup)
            .then(_executionRecovery)
            .catch(_terminalError)
            .then(_slicerInit)
            .catch(_slicerInitRetry)
            .then(_registerSlicers)
            .catch(_terminalError);
    }

    function _executionRecovery() {
        const recoverExecution = testRecovery || process.env.recover_execution;

        return new Promise((resolve, reject) => {
            if (recoverExecution) {
                logger.info(`execution: ${exId} is starting in recovery mode`);
                recovery.initialize();
                events.on('execution:recovery:complete', () => {
                    recovery.getSlicerStartingPosition()
                        .then(executionStartingPoints => resolve(executionStartingPoints))
                        .catch(err => reject(parseError(err)));
                });

                Promise.resolve()
                    .then(recovery.newSlicer)
                    .then(slicerArray => _registerSlicers(slicerArray, 'recovery'))
                    .catch(err => reject(parseError(err)));
            } else {
                resolve([]);
            }
        });
    }

    function _slicerInit(startingPointStateRecords) {
        return slicerModule.newSlicer(context, executionContext, startingPointStateRecords, logger);
    }

    function _slicerInitRetry(slicerError) {
        const errMsg = parseError(slicerError);
        let times = 1;
        const maxRetries = executionContext.config.max_retries;

        logger.error(`Error on slicer initialization, will attempt to retry ${maxRetries} times: ${errMsg}`);
        return new Promise(((resolve, reject) => {
            function retry() {
                _slicerInit()
                    .then((slicerArray) => {
                        logger.info('slicer initialization was successful');
                        resolve(slicerArray);
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

    function _terminalError(err) {
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

    function _engineSetup() {
        engineFn = function slicerEngineExecution() {
            while (workerQueue.size() && slicerQueue.size()) {
                const sliceData = slicerQueue.dequeue();
                const messageData = { to: 'worker', message: 'slicer:slice:new', payload: sliceData };

                if (sliceData.request.request_worker) {
                    const worker = workerQueue.extract('worker_id', sliceData.request.request_worker);
                    if (worker) {
                        messageData.address = worker.worker_id;
                        messaging.send(messageData);
                    } else {
                        events.emit('slice:invalid', sliceData.request);
                        stateStore.updateState(sliceData.request, 'invalid');
                    }
                } else {
                    const worker = workerQueue.dequeue();
                    messageData.address = worker.worker_id;
                    messaging.send(messageData);
                }
            }

            const currentWorkers = workerQueue.size();

            executionAnalytics.set('workers_available', currentWorkers);
            executionAnalytics.set('queued', slicerQueue.size());
            executionAnalytics.set('workers_active', messaging.getClientCounts() - currentWorkers);
            // If all slicers are not done, the slicer queue is not overflown and the scheduler
            // is set, then attempt to provision more slices
            if (scheduler && !allSlicersDone && (slicerQueue.size() < queueLength)) {
                scheduler.forEach((slicerFn) => {
                    slicerFn();
                });
            }
        };

        // send message that execution is in running state
        logger.info(`execution: ${exId} has initialized and is listening on port ${executionConfig.slicer_port}`);
        exStore.setStatus(exId, 'running');

        if (!executionAnalytics) executionAnalytics = require('./execution_analytics')(context, messaging);
        if (!slicerAnalytics) slicerAnalytics = require('./slice_analytics')(context, executionContext);
        _setQueueLength(executionContext);
        if (!recovery) recovery = require('./recovery')(context, messaging, executionAnalytics, exStore, stateStore, executionContext);

        messaging.initialize({ port: executionContext.config.slicer_port });

        // start the engine
        if (engineCanRun) {
            logger.debug('starting the slicer engine');
            engine = setInterval(engineFn, 1);
        }

        _startWorkerConnectionWatchDog();
    }

    function _allocateSlice(sliceRequest, slicerId, slicerOrder) {
        let slice = sliceRequest;
        // recovery slices already have correct meta data
        if (!sliceRequest.slice_id) {
            slice = {
                slice_id: uuid.v4(),
                request: sliceRequest,
                slicer_id: slicerId,
                slicer_order: slicerOrder,
                _created: new Date().toISOString()
            };

            stateStore.createState(exId, slice, 'start');
            logger.trace('enqueuing slice', slice);
        }
        slicerQueue.enqueue(slice);
    }

    function _getScheduler(slicerArray) {
        const lifecycle = executionConfig.lifecycle;
        return slicerArray.map((slicerFn, index) => _createSlices(slicerFn, index, lifecycle));
    }


    function _createSlices(slicerFn, slicerId, lifecycle) {
        let hasCompleted = false;
        let isProcessing = false;
        let slicerOrder = 0;
        // checking if lifecycle is 'once' and not in recovery mode
        const isOnce = (lifecycle === 'once') && recovery.recoveryComplete();

        return function () {
            if (!isProcessing && !hasCompleted) {
                logger.trace(`slicer ${slicerId} is being called`);
                isProcessing = true;
                Promise.resolve()
                    .then(() => slicerFn())
                    .then((sliceRequest) => {
                        // not null or undefined
                        if (sliceRequest != null) {
                            if (_.isArray(sliceRequest)) {
                                logger.warn(`slicer for execution: ${exId} is subslicing by key`);
                                executionAnalytics.increment('subslice_by_key');
                                _.forEach(sliceRequest, (request) => {
                                    _allocateSlice(request, slicerId, slicerOrder += 1);
                                });
                            } else {
                                _allocateSlice(sliceRequest, slicerId, slicerOrder += 1);
                            }
                        } else if (isOnce) {
                            // slicer => a single slicer has finished
                            events.emit('slicer:finished');
                            hasCompleted = true;
                            _slicerCompleted();
                        }
                        isProcessing = false;
                    })
                    .catch((err) => {
                        // retries are handled internally by slicer
                        isProcessing = false;
                        const errMsg = `slicer for ex ${exId} had an error, shutting down execution ${parseError(err)}`;
                        const executionStats = executionAnalytics.getAnalytics();
                        const errorMeta = exStore.failureMetaData(errMsg, executionStats);
                        logger.error(errMsg);

                        exStore.setStatus(exId, 'failed', errorMeta)
                            .then(() => {
                                messaging.send({
                                    to: 'cluster_master',
                                    message: 'execution:error:terminal',
                                    ex_id: exId
                                });
                            });
                    });
            }
        };
    }

    function _pause() {
        logger.info(`execution: ${exId} has received a pause notice`);
        engineCanRun = false;
        clearInterval(engine);
    }

    function _resume() {
        logger.info(`slicer for execution: ${exId} has received a resume notice`);
        engineCanRun = true;
        engine = setInterval(engineFn, 1);
    }

    function _shutdown() {
        engineCanRun = false;
        clearInterval(engine);
    }

    function _adjustSlicerQueueLength() {
        if (dynamicQueueLength && messaging.getClientCounts() > queueLength) {
            queueLength = messaging.getClientCounts();
        }
    }

    function _setQueueLength(executionEnv) {
        const slicer = executionEnv.slicer;
        let length = 10000;
        if (slicer.slicerQueueLength) {
            if (typeof slicer.slicerQueueLength !== 'function') {
                logger.error('slicerQueueLength on the reader must be a function, defaulting to 10000');
            } else {
                const results = slicer.slicerQueueLength(executionEnv);
                if (results === 'QUEUE_MINIMUM_SIZE') {
                    dynamicQueueLength = true;
                    length = executionEnv.config.workers;
                } else if (_.isNumber(results) && results >= 1) {
                    length = results;
                }
            }
        }

        queueLength = length;
    }

    function _checkExecutionState(config) {
        const query = `ex_id:${config.ex_id} AND (state:error OR state:start)`;
        return stateStore.count(query, 0);
    }

    function _logFinishedJob() {
        const end = moment();
        const time = (end - start) / 1000;
        executionAnalytics.set('job_duration', time);

        if (executionConfig.analytics) {
            slicerAnalytics.analyzeStats();
        }

        logger.info(`execution ${executionConfig.name} has finished in ${time} seconds`);
    }

    function _allSlicesProcessed() {
        logger.info(`all slicers for execution: ${exId} have been completed, waiting for slices in slicerQueue to be processed`);
        // all workers have reported back completions
        allSlicersDone = true;
        executionAnalytics.set('queuing_complete', moment().format(dateFormat));
        return new Promise((resolve) => {
            const isDone = setInterval(() => {
                logger.trace(`worker queue: ${workerQueue.size()}, active clients ${messaging.getClientCounts()}, slicer queue: ${slicerQueue.size()}}`);
                const workersCompleted = workerQueue.size() >= messaging.getClientCounts();
                const slicesFinished = slicerQueue.size() === 0;
                if (workersCompleted && slicesFinished) {
                    logger.info(`all work for execution: ${exId} has completed, starting cleanup`);
                    clearInterval(isDone);
                    resolve(true);
                }
            }, 100);
        });
    }

    function _watchDog(checkFn, timeout, errMsg, logMsg) {
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

    function _startWorkerDisconnectWatchDog() {
        const checkFn = () => !isShuttingDown && workerFound && messaging.getClientCounts() === 0;
        const timeout = context.sysconfig.teraslice.worker_disconnect_timeout;
        const errMsg = `all workers from slicer #${exId} have disconnected`;

        _watchDog(checkFn, timeout, errMsg, errMsg);
    }

    function _startWorkerConnectionWatchDog() {
        const checkFn = () => !workerFound;
        const timeout = context.sysconfig.teraslice.slicer_timeout;
        const errMsg = `No workers have connected to slicer in the allotted time: ${timeout} ms`;
        const logMsg = `A worker has not connected to a slicer for ex: ${exId}, shutting down execution`;

        _watchDog(checkFn, timeout, errMsg, logMsg);
    }

    function _executionShutdown() {
        logger.info(`slicer for execution: ${exId} has received a shutdown notice`);
        isShuttingDown = true;
        events.emit('execution:stop');

        function stateStoreShutdown() {
            if (stateStore) {
                return stateStore.shutdown();
            }
            return true;
        }

        Promise.all([_shutdown(), executionAnalytics.shutdown(), stateStoreShutdown()])
            .then(() => logger.flush())
            .then(() => events.emit('execution:shutdown'))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(errMsg);
                events.emit('execution:shutdown');
            });
    }

    function _slicerCompleted() {
        slicerDone += 1;
        logger.info(`a slicer for execution: ${exId} has completed its range`);

        if (slicerDone === totalSlicers) {
            // slicers => all slicers have finished
            events.emit('slicers:finished');
            _allSlicesProcessed()
                .then(() => _executionCompleted());
        }
    }

    function _executionCompleted() {
        if (executionConfig.analytics) {
            _logFinishedJob();
        }
        _checkExecutionState(executionConfig)
            .then((errCount) => {
                const msg = {
                    to: 'cluster_master',
                    message: 'execution:finished',
                    ex_id: executionConfig.ex_id
                };
                const executionStats = executionAnalytics.getAnalytics();

                if (errCount > 0) {
                    const message = `execution: ${exId} had ${errCount} slice failures during processing`;
                    const errorMeta = exStore.failureMetaData(message, executionStats);
                    logger.error(message);
                    exStore.setStatus(exId, 'failed', errorMeta);
                } else {
                    logger.info(`execution ${exId} has completed`);
                    const metaData = exStore.failureMetaData(false, executionStats);
                    exStore.setStatus(exId, 'completed', metaData);
                }
                messaging.send(msg);
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`execution ${exId} has run to completion but the process has failed while updating the execution status, slicer will soon exit, error: ${errMsg}`);
                setTimeout(() => events.emit('execution:shutdown'), 100);
            });
    }

    function testContext(_executionAnalytics, _slicerAnalytics, _recovery, _exId, _testRecovery) {
        if (_executionAnalytics) executionAnalytics = _executionAnalytics;
        if (_slicerAnalytics) slicerAnalytics = _slicerAnalytics;
        if (_recovery) recovery = _recovery;
        if (_testRecovery) testRecovery = _testRecovery;
        exId = _exId;

        return {
            workerQueue,
            slicerQueue,
            _getQueueLength: () => queueLength,
            _allocateSlice,
            _getScheduler,
            _registerSlicers,
            _setQueueLength,
            _adjustSlicerQueueLength,
            _pause,
            _resume,
            _shutdown,
            _executionShutdown,
            _engineSetup,
            _executionRecovery,
            _terminalError,
            _slicerInitRetry,
            _startWorkerConnectionWatchDog,
            _startWorkerDisconnectWatchDog,
            _executionCompleted
        };
    }

    return {
        initialize,
        __test_context: testContext
    };
};
