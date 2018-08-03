'use strict';

const Queue = require('@terascope/queue');
const uuid = require('uuid');
const parseError = require('@terascope/error-parser');
const _ = require('lodash');
const Promise = require('bluebird');
const NodeCache = require('node-cache');
const { newFormattedDate } = require('../../utils/date_utils');

module.exports = function module(context, messaging, exStore, stateStore, config = {}) {
    const start = Date.now();
    const events = context.apis.foundation.getSystemEvents();

    const {
        exId = process.env.ex_id,
        jobId = process.env.job_id,
    } = config;

    const executionRunner = require('../runners/execution')(context, config);

    let isTesting = false;

    let executionAnalytics;
    let slicerAnalytics;
    let recovery;
    let testRecovery;
    let executionContext;
    let executionConfig;
    let slicerModule;
    let startingPointStateRecords;
    let engineFnRunning = false;

    const logger = context.apis.foundation.makeLogger({ module: 'execution_engine', ex_id: exId, job_id: jobId });
    const workerQueue = new Queue();
    const slicerQueue = new Queue();

    const watchDogTimeouts = [];

    const cache = new NodeCache({
        stdTTL: 30 * 60 * 1000, // 30 minutes
        checkperiod: 10 * 60 * 1000, // 10 minutes
        useClones: false,
    });

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
            _enqueueWorker(workerOnlineData);
        }
    });

    messaging.register({
        event: 'worker:slice:complete',
        identifier: 'worker_id',
        callback: (msg, workerId) => {
            const workerResponse = msg.payload;
            const sliceId = _.get(workerResponse, 'slice.slice_id');

            const cachekey = JSON.stringify(_.pick(workerResponse, ['slice', 'worker_id']));
            const alreadyCompleted = cache.get(cachekey);
            const shouldEnqueue = !workerResponse.isShuttingDown;

            cache.set(cachekey, true);

            if (workerResponse.retry) {
                logger.warn(`worker: ${workerId} has rejoined slicer: ${exId}`);
                executionAnalytics.increment('workers_reconnected');
            }

            if (alreadyCompleted) {
                logger.warn(`worker: ${workerId} already marked slice ${sliceId} as complete`);
            } else {
                executionAnalytics.increment('processed');

                if (workerResponse.error) {
                    logger.error(`worker: ${workerId} has error on slice: ${JSON.stringify(workerResponse)} , slicer: ${exId}`);
                    executionAnalytics.increment('failed');
                    events.emit('slice:failure', workerResponse);
                } else {
                    if (workerResponse.analytics) {
                        slicerAnalytics.addStats(workerResponse.analytics);
                    }

                    events.emit('slice:success', workerResponse);
                }
                logger.debug(`worker ${workerId} has completed its slice,`, workerResponse);
            }

            messaging.respond(msg, {
                payload: {
                    slice_id: sliceId,
                    recorded: true
                }
            });

            if (shouldEnqueue) _enqueueWorker(workerResponse);
        }
    });

    messaging.register({
        event: 'network:disconnect',
        identifier: 'worker_id',
        callback: (msg, workerId) => {
            executionAnalytics.increment('workers_disconnected');
            const reason = !_.isEmpty(msg) ? ` for reason ${JSON.stringify(msg)}` : '';
            logger.warn(`Worker: ${workerId} has disconnected${reason}`);
            // if there are less clients than the length of the queue, decrease the queue size
            _adjustSlicerQueueLength();
            workerQueue.remove(workerId, 'worker_id');
            events.emit('network:disconnect', workerId);
            _startWorkerDisconnectWatchDog();
        }
    });

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
            if (executionConfig.lifecycle === 'once') {
                events.once('slice:failure', _setFailingStatus);
            } else {
                // in persistent mode we set watchdogs to monitor
                // when failing can be set back to running
                events.on('slice:failure', _checkAndUpdateExecutionState());
            }
        }
    }

    function initialize() {
        return Promise.resolve()
            .then(_executionInit)
            .then(_engineSetup)
            .then(_executionRecovery)
            .catch(terminalError)
            .then(_slicerInit)
            .catch(_slicerInitRetry)
            .then(_registerSlicers)
            .catch(terminalError);
    }

    function _executionInit() {
        return executionRunner.initialize(events, logger)
            .then((_executionContext) => {
                if (!isTesting) {
                    executionContext = _executionContext;
                    executionConfig = executionContext.config;
                    slicerModule = executionContext.slicer;
                }
                return true;
            });
    }

    function _executionRecovery() {
        const recoverExecution = testRecovery || executionConfig.recovered_execution;

        return new Promise((resolve, reject) => {
            if (recoverExecution) {
                logger.info(`execution: ${exId} is starting in recovery mode`);
                recovery.initialize();
                events.on('execution:recovery:complete', (executionStartingPoints) => {
                    startingPointStateRecords = executionStartingPoints;
                    resolve(executionStartingPoints);
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

    function _slicerInit(startingStateRecords) {
        const startingPoint = startingStateRecords || startingPointStateRecords;
        if (_.get(startingPoint, '_exit', null)) return Promise.resolve([() => null]);

        return slicerModule.newSlicer(context, executionContext, startingPoint, logger);
    }

    function _slicerInitRetry(slicerError) {
        const errMsg = parseError(slicerError);
        let times = 1;
        const maxRetries = executionContext.config.max_retries;

        logger.error(`Error on slicer initialization, will attempt to retry ${maxRetries} times: ${errMsg}`);
        return new Promise(((resolve, reject) => {
            function retry() {
                _slicerInit(startingPointStateRecords)
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
                            reject(new Error(`Could not initialize slicers, error: ${retryErrMsg}`));
                        }
                    });
            }

            retry();
        }));
    }

    function terminalError(err) {
        const errMsg = parseError(err);
        const executionStats = executionAnalytics.getAnalytics();
        const errorMeta = exStore.executionMetaData(executionStats, errMsg);
        logger.error(errMsg);

        exStore.setStatus(exId, 'failed', errorMeta)
            .then(() => {
                messaging.send({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: exId,
                    payload: { set_status: true }
                });

                return null; // See http://goo.gl/rRqMUw
            });
    }

    function _sendSlice(sliceData, address) {
        logger.debug(`Sending slice to ${address}`);

        const messageData = {
            to: 'worker',
            address,
            message: 'slicer:slice:new',
            payload: sliceData,
            response: true
        };

        return messaging.send(messageData)
            .then((res) => {
                const workerResponse = _.get(res, 'payload.willProcess', null);
                if (workerResponse == null) return Promise.reject(new Error('worker is not responding back with correctly formatted message'));
                if (workerResponse === false) {
                    logger.warn(`worker ${address} was given another slice before finishing current work, re-enqueueing slice`);
                    slicerQueue.unshift(sliceData);
                }
                return true;
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`error while waiting for a response for slice allocation to worker ${address}, error: ${errMsg}`);
            });
    }

    function _engineSetup() {
        engineFn = function slicerEngineExecution() {
            // since the interval is 1ms, we must make sure we are double processing this
            if (engineFnRunning) return;
            engineFnRunning = true;

            while (workerQueue.size() && slicerQueue.size()) {
                const sliceData = slicerQueue.dequeue();

                if (sliceData.request.request_worker) {
                    const worker = workerQueue.extract('worker_id', sliceData.request.request_worker);
                    if (worker) {
                        _sendSlice(sliceData, worker.worker_id);
                    } else {
                        events.emit('slice:invalid', sliceData.request);
                        stateStore.updateState(sliceData.request, 'invalid');
                    }
                } else {
                    const worker = workerQueue.dequeue();
                    _sendSlice(sliceData, worker.worker_id);
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
            engineFnRunning = false;
        };

        // send message that execution is in running state
        logger.info(`execution: ${exId} has initialized and is listening on port ${executionConfig.slicer_port}`);
        exStore.setStatus(exId, 'running');
        if (!executionAnalytics) executionAnalytics = require('./execution_analytics')(context, messaging, config);
        if (!slicerAnalytics) slicerAnalytics = require('./slice_analytics')(context, executionContext);
        _setQueueLength(executionContext);
        if (!recovery) recovery = require('./recovery')(context, terminalError, stateStore, executionContext);

        messaging.listen({ port: executionContext.config.slicer_port });

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
        const { lifecycle } = executionConfig;
        return slicerArray.map((slicerFn, index) => _createSlices(slicerFn, index, lifecycle));
    }

    function _createSlices(slicerFn, slicerId, lifecycle) {
        let hasCompleted = false;
        let isProcessing = false;
        let slicerOrder = 0;
        // checking if lifecycle is 'once' and not in recovery mode
        const isOnce = (lifecycle === 'once') && recovery.recoveryComplete();

        return function createSliceFn() {
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

                        return null; // See http://goo.gl/rRqMUw
                    })
                    .catch((err) => {
                        // retries are handled internally by slicer
                        isProcessing = false;
                        const errMsg = `slicer for ex ${exId} had an error, shutting down execution ${parseError(err)}`;
                        const executionStats = executionAnalytics.getAnalytics();
                        const errorMeta = exStore.executionMetaData(executionStats, errMsg);
                        logger.error(errMsg);
                        // stop the engine since we are shutting down
                        clearInterval(engine);

                        exStore.setStatus(exId, 'failed', errorMeta)
                            .then(() => {
                                messaging.send({
                                    to: 'cluster_master',
                                    message: 'execution:error:terminal',
                                    ex_id: exId
                                });
                                return null; // See http://goo.gl/rRqMUw
                            });

                        return null; // See http://goo.gl/rRqMUw
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

    function _adjustSlicerQueueLength() {
        if (dynamicQueueLength && messaging.getClientCounts() > queueLength) {
            queueLength = messaging.getClientCounts();
            logger.info(`adjusted queue length ${queueLength}`);
        }
    }

    function _setQueueLength(executionEnv) {
        const { slicer } = executionEnv;
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

    function _checkExecutionState(ex) {
        const query = `ex_id:${ex.ex_id} AND (state:error OR state:start)`;
        return stateStore.count(query, 0);
    }

    function _logFinishedJob() {
        const end = Date.now();
        const time = (end - start) / 1000;
        executionAnalytics.set('job_duration', time);

        if (executionConfig.analytics) {
            slicerAnalytics.analyzeStats();
        }

        logger.info(`execution ${exId} has finished in ${time} seconds`);
    }

    function _allSlicesProcessed() {
        logger.info(`all slicers for execution: ${exId} have been completed, waiting for slices in slicerQueue to be processed`);
        // all workers have reported back completions
        allSlicersDone = true;
        executionAnalytics.set('queuing_complete', newFormattedDate());
        return new Promise((resolve) => {
            const isDone = setInterval(() => {
                logger.trace(`worker queue: ${workerQueue.size()}, active clients ${messaging.getClientCounts()}, slicer queue: ${slicerQueue.size()}`);
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

    function _checkAndUpdateExecutionState() {
        let watchDogSet = false;
        let errorCount;
        let processedCount;
        let watcher;

        return () => {
            if (watchDogSet) return;
            watchDogSet = true;
            const analyticsData = executionAnalytics.getAnalytics();
            // keep track of how many slices have been processed and failed
            errorCount = analyticsData.failed;
            processedCount = analyticsData.processed;
            _setFailingStatus();

            watcher = setInterval(() => {
                const currentAnalyticsData = executionAnalytics.getAnalytics();
                const currentErrorCount = currentAnalyticsData.failed;
                const currentProcessedCount = currentAnalyticsData.processed;
                const errorCountTheSame = currentErrorCount === errorCount;
                const slicesHaveProcessedSinceError = currentProcessedCount > processedCount;

                if (errorCountTheSame && slicesHaveProcessedSinceError) {
                    clearInterval(watcher);
                    logger.info(`No slice errors have occurred within execution: ${exId} will be set back to 'running' state`);
                    exStore.setStatus(exId, 'running');
                    return;
                }
                errorCount = currentErrorCount;
                processedCount = currentProcessedCount;
            }, executionConfig.probation_window);
        };
    }

    function _setFailingStatus() {
        const errMsg = `slicer: ${exId} has encountered a processing_error`;
        logger.error(errMsg);
        const executionStats = executionAnalytics.getAnalytics();
        const errorMeta = exStore.executionMetaData(executionStats, errMsg);
        exStore.setStatus(exId, 'failing', errorMeta);
    }

    function _watchDog(checkFn, timeout, errMsg, logMsg) {
        const timer = setTimeout(() => {
            if (!checkFn()) return;
            // if after a a set time there are still no workers, it will shutdown
            logger.error(logMsg);
            const executionStats = executionAnalytics.getAnalytics();
            const errorMetaData = exStore.executionMetaData(executionStats, errMsg);
            exStore.setStatus(exId, 'failed', errorMetaData)
                .then(() => {
                    messaging.send({
                        to: 'cluster_master',
                        message: 'execution:error:terminal',
                        ex_id: exId,
                        payload: { set_status: true }
                    });
                    return null; // See http://goo.gl/rRqMUw
                });
        }, timeout);

        // store timeouts to make sure we don't have dangling async requests
        watchDogTimeouts.push(timer);
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

    function shutdown() {
        logger.info(`slicer for execution: ${exId} has received a shutdown notice`);
        isShuttingDown = true;
        engineCanRun = false;
        clearInterval(engine);
        events.emit('execution:stop');
        _.forEach(watchDogTimeouts, clearTimeout);
        return Promise.resolve()
            .then(executionAnalytics.shutdown)
            .then(() => logger.flush())
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(errMsg);
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
        cache.flushAll();
        cache.close();

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
                    const errorMeta = exStore.executionMetaData(executionStats, message);
                    logger.error(message);
                    exStore.setStatus(exId, 'failed', errorMeta);
                } else {
                    logger.info(`execution ${exId} has completed`);
                    const metaData = exStore.executionMetaData(executionStats);
                    exStore.setStatus(exId, 'completed', metaData);
                }

                messaging.send(msg);
                return null; // See http://goo.gl/rRqMUw
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`execution ${exId} has run to completion but the process has failed while updating the execution status, slicer will soon exit, error: ${errMsg}`);
                setTimeout(() => events.emit('execution:shutdown'), 100);
            });
    }

    function _enqueueWorker(worker) {
        if (worker == null || !worker.worker_id) {
            throw new Error('Failed to enqueue invalid worker');
        }

        if (worker.worker_id && workerQueue.exists('worker_id', worker.worker_id)) {
            return;
        }

        workerQueue.enqueue(worker);
    }

    /* eslint-disable-next-line */
    function testContext(_executionContext, _executionAnalytics, _slicerAnalytics, _recovery, _testRecovery) {
        isTesting = true;
        if (_executionAnalytics) executionAnalytics = _executionAnalytics;
        if (_slicerAnalytics) slicerAnalytics = _slicerAnalytics;
        if (_recovery) recovery = _recovery;
        if (_testRecovery) testRecovery = _testRecovery;
        if (_executionContext) {
            executionContext = _executionContext;
            executionConfig = executionContext.config;
            slicerModule = executionContext.slicer;
        }

        return {
            workerQueue,
            slicerQueue,
            cache,
            _enqueueWorker,
            _getQueueLength: () => queueLength,
            _allocateSlice,
            _getScheduler,
            _registerSlicers,
            _setQueueLength,
            _adjustSlicerQueueLength,
            _pause,
            _resume,
            _executionInit,
            _engineSetup,
            _executionRecovery,
            terminalError,
            _slicerInitRetry,
            _startWorkerConnectionWatchDog,
            _startWorkerDisconnectWatchDog,
            _executionCompleted,
            _sendSlice
        };
    }

    return {
        initialize,
        shutdown,
        __test_context: testContext
    };
};
