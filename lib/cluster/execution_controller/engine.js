'use strict';

const Queue = require('queue');
const uuid = require('uuid');
const dateFormat = require('../../utils/date_utils').dateFormat;
const parseError = require('error_parser');
const moment = require('moment');
const _ = require('lodash');

module.exports = function module(executionModules) {
    const context = executionModules.context;
    const messaging = executionModules.messaging;
    const executionAnalytics = executionModules.executionAnalytics;
    const exStore = executionModules.exStore;
    const stateStore = executionModules.stateStore;
    const executionConfig = executionModules.executionContext.config;
    const slicerAnalytics = executionModules.slicerAnalytics;

    const start = moment();
    const events = context.apis.foundation.getSystemEvents();
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const logger = context.apis.foundation.makeLogger({ module: 'execution_engine', ex_id: exId, job_id: jobId });

    const workerQueue = new Queue();
    const slicerQueue = new Queue();

    let scheduler;
    let slicers;
    let engineFn;
    let engine;
    let engineCanRun = true;
    let slicerDone = 0;
    let totalSlicers = 0;
    let allSlicersDone = false;
    let dynamicQueueLength = false;

    let queueLength;


    function registerSlicers(slicersArray) {
        if (!Array.isArray(slicersArray)) {
            throw new Error(`newSlicer from module ${executionConfig.operations[0]._op} needs to return an array of slicers`);
        }
        totalSlicers = slicersArray.length;
        executionAnalytics.set('slicers', totalSlicers);
        slicers = slicersArray;
        scheduler = _getScheduler(slicers);
    }

    function initialize() {
        engineFn = function slicerEngineExecution() {
            while (workerQueue.size() && slicerQueue.size()) {
                const worker = workerQueue.dequeue();
                const sliceData = slicerQueue.dequeue();
                messaging.send({
                    to: 'worker',
                    address: worker.worker_id,
                    message: 'slicer:slice:new',
                    payload: sliceData
                });
            }

            const currentWorkers = workerQueue.size();

            executionAnalytics.set('workers_available', currentWorkers);
            executionAnalytics.set('queued', slicerQueue.size());
            executionAnalytics.set('workers_active', messaging.getClientCounts() - currentWorkers);

            // don't run slicers if recovering, all slices have been divided up
            // or if the queue is too large
            if (scheduler && !allSlicersDone && slicerQueue.size() < queueLength) {
                scheduler.forEach((slicerFn) => {
                    slicerFn();
                });
            }
        };

        // send message that execution is in running state
        logger.info(`execution: ${exId} has initialized and is listening on port ${executionConfig.slicer_port}`);
        exStore.setStatus(exId, 'running');

        // start the engine
        if (engineCanRun) {
            logger.debug('starting the slicer engine');
            engine = setInterval(engineFn, 1);
        }
    }

    function _allocateSlice(sliceRequest, slicerId, slicerOrder) {
        const slice = {
            slice_id: uuid.v4(),
            request: sliceRequest,
            slicer_id: slicerId,
            slicer_order: slicerOrder,
            _created: new Date().toISOString()
        };

        stateStore.createState(exId, slice, 'start');
        logger.trace('enqueuing slice', slice);
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
        const isOnce = lifecycle === 'once';

        return function () {
            if (!isProcessing && !hasCompleted) {
                logger.trace(`slicer ${slicerId} is being called`);
                isProcessing = true;
                Promise.resolve(slicerFn())
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

    function enqueueWorker(worker) {
        workerQueue.enqueue(worker);
    }

    function removeWorker(workerId) {
        workerQueue.remove(workerId);
    }

    function pause() {
        logger.info(`execution: ${exId} has received a pause notice`);
        engineCanRun = false;
        clearInterval(engine);
    }

    function resume() {
        logger.info(`slicer for execution: ${exId} has received a resume notice`);
        engineCanRun = true;
        engine = setInterval(engineFn, 1);
    }

    function shutdown() {
        engineCanRun = false;
        clearInterval(engine);
    }

    function adjustQueueLength() {
        if (dynamicQueueLength && messaging.getClientCounts() > queueLength) {
            queueLength = messaging.getClientCounts();
        }
    }

    function setQueueLength(executionEnv) {
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

    function enqueueSlice(slice) {
        slicerQueue.enqueue(slice);
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

    function _slicerCompleted() {
        slicerDone += 1;
        logger.info(`a slicer for execution: ${exId} has completed its range`);

        if (slicerDone === totalSlicers) {
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
                    const metaData = exStore.executionMetaData(false, executionStats);
                    exStore.setStatus(exId, 'completed', metaData);
                }

                messaging.send(msg);
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`execution ${exId} has run to completion but the process has failed while updating the execution status, slicer will soon exit, error: ${errMsg}`);
                setTimeout(() => process.exit(), 100);
            });
    }

    return {
        initialize,
        registerSlicers,
        setQueueLength,
        adjustQueueLength,
        enqueueWorker,
        removeWorker,
        enqueueSlice,
        pause,
        resume,
        shutdown
    };
};
