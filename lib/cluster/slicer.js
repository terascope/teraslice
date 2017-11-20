'use strict';

const moment = require('moment');
const Promise = require('bluebird');
const uuid = require('uuid');
const _ = require('lodash');

const Queue = require('queue');

const workerQueue = new Queue();
const slicerQueue = new Queue();

const statContainer = require('../utils/analytics').statContainer;
const addStats = require('../utils/analytics').addStats;
const analyzeStats = require('../utils/analytics').analyzeStats;
const dateFormat = require('../utils/date_utils').dateFormat;
const parseError = require('error_parser');
const messageModule = require('./services/messaging');


module.exports = function module(contextConfig) {
    let context = contextConfig;
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const jobRunner = require('./runners/job')(context);
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'slicer', ex_id: exId, job_id: jobId });
    const messaging = messageModule(context, logger);

    // Stateful variables
    const start = moment();
    let engineCanRun = true;
    let slicerDone = 0;
    let totalSlicers = 0;
    let allSlicersDone = false;
    let inRecoveryMode = false;
    let hasRecovered = false;
    let workerFound = false;
    let isShuttingDown = false;
    let dynamicQueueLength = false;

    // temporary fix
    const retryState = {};

    const slicerAnalytics = {
        workers_available: 0,
        workers_active: 0,
        workers_joined: 0,
        workers_reconnected: 0,
        workers_disconnected: 0,
        failed: 0,
        subslices: 0,
        queued: 0,
        slice_range_expansion: 0,
        processed: 0,
        slicers: 0,
        subslice_by_key: 0,
        started: moment().format(dateFormat)
    };
    // a place for tracking differences so collector (cluster master) does not have to
    // manage extra state
    let pushedAnalytics = {
        processed: 0,
        failed: 0,
        queued: 0,
        job_duration: 0,
        workers_joined: 0,
        workers_disconnected: 0,
        workers_reconnected: 0
    };

    let analyticsTimer;
    let queueLength;
    let engine;
    let scheduler;
    let job;
    let slicer;
    let analyticsData;
    let stateStore;
    let exStore;
    let engineFn;
    let retryData;

    // events can be fired from anything that instantiates a client, such as stores and slicers
    // needs to be setup before jobRunner
    events.on('getClient:config_error', terminalShutdown);

    /*
     Main logic
     _______________________________________________________
     */

    messaging.register({ event: 'worker:shutdown', callback: slicerShutdown });

    messaging.register({
        event: 'assets:loaded',
        callback: (ipcMessage) => {
            events.emit('slicer:assets_loaded', ipcMessage);
        } });

    messaging.register({
        event: 'cluster:execution:pause',
        callback: (msg) => {
            logger.info(`slicer for job: ${exId} has received a pause notice`);
            engineCanRun = false;
            clearInterval(engine);
            events.emit('job:pause');
            messaging.respond(msg);
        }
    });

    messaging.register({
        event: 'cluster:execution:resume',
        callback: (msg) => {
            logger.info(`slicer for job: ${exId} has received a resume notice`);
            engine = setInterval(engineFn, 1);
            engineCanRun = true;
            events.emit('job:resume');
            messaging.respond(msg);
        }
    });

    messaging.register({
        event: 'cluster:slicer:analytics',
        callback: (msg) => {
            logger.debug('api is requesting slicer analytics', slicerAnalytics);
            const name = job ? job.jobConfig.name : JSON.parse(process.env.job).name;
            messaging.respond(msg, {
                data: {
                    node_id: msg.node_id,
                    name,
                    job_id: jobId,
                    ex_id: exId,
                    stats: slicerAnalytics
                }
            });
        }
    });

    // to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    messaging.register({ event: 'process:SIGTERM', callback: noOP });
    messaging.register({ event: 'process:SIGINT', callback: noOP });


    events.on('slicer:job:update', (data) => {
        logger.debug('slicer sending a job update', data.update);
        // this is updating the opConfig for elasticsearch start and/or end dates for ex,
        // this assumes elasticsearch is first
        exStore.update(exId, { operations: data.update });
    });

    messaging.register({
        event: 'worker:ready',
        identifier: 'worker_id',
        callback: (msg, workerId) => {
            workerFound = true;
            logger.info(`worker: ${workerId} has joined slicer: ${exId}`);
            slicerAnalytics.workers_joined += 1;
            // if there are more clients than the length of the queue, increase the queue size
            if (dynamicQueueLength && messaging.getClientCounts() > queueLength) {
                queueLength = messaging.getClientCounts();
            }
            // messaging module will join connection
            workerQueue.enqueue(msg.payload);
        }
    });

    messaging.register({
        event: 'worker:slice:complete',
        identifier: 'worker_id',
        callback: (msg, workerId) => {
            const sliceData = msg.payload;
            slicerAnalytics.processed += 1;
            // Need to join room if a restart happened
            if (sliceData.retry) {
                logger.warn(`worker: ${workerId} has rejoined slicer: ${exId}`);
                slicerAnalytics.workers_reconnected += 1;
                // messaging module will join connection
            }

            if (sliceData.error) {
                logger.error(`worker: ${workerId} has error on slice: ${JSON.stringify(sliceData)} , slicer: ${exId}`);
                slicerAnalytics.failed += 1;
                events.emit('slice:failure', sliceData);
                // if an error occurred while in recovery, fail the job as a whole
                if (inRecoveryMode) {
                    // sending to remove any pending worker allocations and to stop other workers
                    messaging.send({
                        to: 'cluster_master',
                        message: 'slicer:recovery:failed',
                        ex_id: exId
                    });
                    const errorMeta = exStore.failureMeta('there were errors processing a slice in recovery mode', slicerAnalytics);
                    exStore.setStatus(exId, 'failed', errorMeta);
                }
            } else {
                if (sliceData.analytics) {
                    addStats(analyticsData, sliceData.analytics);
                }

                // temporary for retry mode
                if (inRecoveryMode) {
                    delete retryState[sliceData.slice.slice_id];
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
    // TODO: review this
    messaging.register({
        event: 'network:disconnect',
        identifier: 'worker_id',
        callback: (workerId) => {
            slicerAnalytics.workers_disconnected += 1;
            logger.warn(`Worker: ${workerId} has disconnected`);
            events.emit('network:disconnect', workerId);
            // if there are less clients than the length of the queue, decrease the queue size
            if (dynamicQueueLength && messaging.getClientCounts() < queueLength) {
                queueLength = messaging.getClientCounts();
            }
            workerQueue.remove(workerId);
            // only call if workers have connected before, and there are none left
            if (!isShuttingDown && workerFound && messaging.getClientCounts() === 0) {
                // TODO this needs a refactor for when slicer controls ex state
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

    events.on('slicer:slice:recursion', () => {
        logger.trace('id sublicing has occurred');
        slicerAnalytics.subslices += 1;
    });

    events.on('slicer:slice:range_expansion', () => {
        logger.trace('a slice range expansion has occurred');
        slicerAnalytics.slice_range_expansion += 1;
    });

    events.on('slicer:recovery:enqueued', () => {
        logger.info(`The recovered data for job: ${exId} has successfully been enqueued`);
        hasRecovered = true;
        inRecoveryMode = false;
    });

    events.once('slice:failure', () => {
        logger.error(`slicer: ${exId} has encountered a processing_error`);
        const errorMeta = exStore.failureMeta(null, slicerAnalytics);
        exStore.setStatus(exId, 'failing', errorMeta);
    });

    events.on('slicer:execution:finished', () => {
        slicerDone += 1;
        logger.info(`a slicer for job: ${exId} has completed its range`);

        if (slicerDone === totalSlicers) {
            logger.info(`all slicers for job: ${exId} have been completed, waiting for slices in slicerQueue to be processed`);
            // all workers have reported back completions
            allSlicersDone = true;
            slicerAnalytics.queuing_complete = moment().format(dateFormat);

            const isDone = setInterval(() => {
                // slicer is done when slice queue is empty and all workers have reported back from
                // processing
                logger.trace(`worker queue: ${workerQueue.size()}, active clients ${messaging.getClientCounts()}, slicer queue: ${slicerQueue.size()}, in recovery mode: ${inRecoveryMode}`);
                const workersCompleted = workerQueue.size() >= messaging.getClientCounts();
                const slicesFinished = slicerQueue.size() === 0 && !inRecoveryMode;
                if (workersCompleted && slicesFinished) {
                    logger.info(`all work for job: ${exId} has completed, starting cleanup`);

                    clearInterval(isDone);
                    if (job.jobConfig.analytics) {
                        logFinishedJob();
                    }
                    checkJobState(job.jobConfig)
                        .then((errCount) => {
                            const msg = {
                                to: 'cluster_master',
                                message: 'slicer:execution:finished',
                                ex_id: job.jobConfig.ex_id
                            };

                            if (errCount > 0) {
                                const message = `job: ${exId} had ${errCount} slice failures during processing`;
                                logger.error(message);
                                const errorMeta = exStore.failureMeta(message, slicerAnalytics);
                                exStore.setStatus(exId, 'failed', errorMeta);
                            } else {
                                logger.info(`job ${exId} has completed`);
                                const metaData = { _slicer_stats: slicerAnalytics };
                                if (hasRecovered) {
                                    metaData._has_errors = 'recovered';
                                }
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
            }, 500);
        }
    });


    // if slicer has restart by itself, terminate job, need to wait for registration of process
    // message functions before we can send this message
    if (process.env.__process_restart) {
        // TODO need to restart slicer and make all recoverable
        const errMsg = `Slicer for ex_id: ${exId} runtime error led to a restart, terminating job with failed status, please use the recover api to return slicer to a consistent state`;
        logger.error(errMsg);
        // exStore may not be instantiated, need to rely on CM to mark job as failed
        messaging.send({
            to: 'cluster_master',
            message: 'execution:error:terminal',
            error: errMsg,
            ex_id: exId
        });
    } else {
        Promise.resolve(require('./storage/assets')(context))
            .then(() =>
                // assets store is loaded so it can register under context.apis
                jobRunner.initialize(events, logger)
            )
            .then((_job) => {
                job = _job;
                slicer = _job.slicer;
                queueLength = parseQueueLength(job.slicer, job.jobConfig);
                analyticsData = statContainer(_job.jobs);
                return Promise.all([require('./storage/state')(context), require('./storage/execution')(context)]);
            })
            .spread((stateStorage, exStorage) => {
                stateStore = stateStorage;
                exStore = exStorage;
                logger.trace('stateStore and job_store for slicer has been initialized');
                messaging.initialize({ port: job.jobConfig.slicer_port });

                // We're ready for execution
                startSlicer();
            })
            .catch((err) => {
                logger.error(`Slicer: failure during initialization for job ${exId}`);
                const errMsg = parseError(err);
                logger.error(errMsg);
                // exStore may not be instantiated, need to rely on CM to mark job as failed
                messaging.send({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    error: errMsg,
                    ex_id: exId
                });
            });
    }

    function slicerRecovery() {
        const recoveredSlices = [];
        const recoverExecution = process.env.recover_execution;
        const slicerTimeout = context.sysconfig.teraslice.slicer_timeout;

        if (recoverExecution && job.jobConfig.lifecycle === 'once') {
            logger.info(`slicer: ${exId} is starting in recovery mode`);
            inRecoveryMode = true;

            const numOfSlicersToRecover = job.jobConfig.slicers;
            for (let i = 0; i < numOfSlicersToRecover; i += 1) {
                recoveredSlices.push(stateStore.recoveryContext(recoverExecution, i));
            }
        }

        // if no worker has attached in allotted time, shutdown job
        setTimeout(() => {
            if (!workerFound) {
                logger.error(`A worker has not connected to a slicer for ex: ${exId}, shutting down job`);
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

        return Promise.all(recoveredSlices);
    }

    function terminalError(err) {
        const errMsg = parseError(err);
        logger.error(errMsg);
        const errorMeta = exStore.failureMeta(errMsg, slicerAnalytics);

        exStore.setStatus(exId, 'failed', errorMeta)
            .then(() => {
                messaging.send({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: exId
                });
            });
    }


    function slicerInit(retryDataList) {
        if (retryDataList) {
            retryData = retryDataList;
        }

        if (retryData.length > 0) {
            logger.debug(`There are ${retryData.length} segments that are being recovered,`);
            logger.trace('retry data,', JSON.stringify(retryData));
        }

        return slicer.newSlicer(context, job, retryData, slicerAnalytics, logger);
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

    function slicerEngine(slicers) {
        if (!Array.isArray(slicers)) {
            throw new Error(`newSlicer from module ${job.jobConfig.operations[0]._op} needs to return an array of slicers`);
        }
        totalSlicers = slicers.length;
        slicerAnalytics.slicers = totalSlicers;
        scheduler = getScheduler(slicers);

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
            slicerAnalytics.workers_available = currentWorkers;
            slicerAnalytics.queued = slicerQueue.size();
            slicerAnalytics.workers_active = messaging.getClientCounts() - currentWorkers;

            // don't run slicers if recovering, all slices have been divided up
            // or if the queue is too large
            if (!inRecoveryMode && !allSlicersDone && slicerQueue.size() < queueLength) {
                scheduler.forEach((slicerFn) => {
                    slicerFn();
                });
            }
        };

        // send message that job is in running state
        logger.info(`slicer: ${job.jobConfig.ex_id} has initialized and is listening on port ${job.jobConfig.slicer_port}`);
        exStore.setStatus(exId, 'running');

        // provision the retry data to the slicerQueue if they exist
        if (retryData.length > 0) {
            getRetryData(retryData);
        }

        // start the engine
        if (engineCanRun) {
            logger.debug('starting the slicer engine');
            engine = setInterval(engineFn, 1);
        }

        // push analytics to cluster master to support cluster level analytics
        analyticsTimer = setInterval(pushAnalytics, context.sysconfig.teraslice.analytics_rate);
    }

    function pushAnalytics() {
        // save a copy of what we push so we can emit diffs
        const diffs = {};
        const copy = {};
        _.forOwn(pushedAnalytics, (value, field) => {
            diffs[field] = slicerAnalytics[field] - value;
            copy[field] = slicerAnalytics[field];
        });
        // TODO: use payload here
        messaging.send({
            to: 'cluster_master',
            message: 'cluster:analytics',
            stats: diffs,
            kind: 'slicer'
        });
        pushedAnalytics = copy;
    }

    function startSlicer() {
        Promise.resolve(slicerRecovery())
            .catch(terminalError)
            .then(slicerInit)
            .catch(slicerInitRetry)
            .then(slicerEngine)
            .catch(terminalError);
    }

    function slicerShutdown() {
        logger.info(`slicer for job: ${exId} has received a shutdown notice`);
        isShuttingDown = true;
        engineCanRun = false;
        clearInterval(engine);
        clearInterval(analyticsTimer);
        pushAnalytics();
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
        logger.error(`Terminal error: shutting down job ${exId}`);
        // exStore may not be initialized, must rely on CM
        messaging.send({
            to: 'cluster_master',
            message: 'execution:error:terminal',
            error: errEV.err,
            ex_id: exId
        });
    }

    function getRetryData(retryArray, retryObj) {
        let isGettingData = false;
        const retryMetadata = retryObj || retryArray.shift();
        logger.debug(`adding ${retryMetadata.retryList.length} to the slicer queue`);
        if (retryMetadata.retryList && retryMetadata.retryList.length > 0) {
            retryMetadata.retryList.forEach((doc) => {
                // keep state of slices doled out, removed at slice complete events

                retryState[doc.slice_id] = true;
                slicerQueue.enqueue(doc);
            });
        }

        const retrySlicer = setInterval(() => {
            // only get more data if slicerQueue is empty and all work has been reported
            const retryLength = Object.keys(retryState).length;
            if (slicerQueue.size() === 0 && retryLength === 0 && !isGettingData) {
                isGettingData = true;

                // remove all intervals/timeouts
                clearInterval(retrySlicer);

                stateStore.recoveryContext(retryMetadata.ex_id, retryMetadata.slicer_id)
                    .then((resultObj) => {
                        // if any data returns run it again
                        if (resultObj.retryList.length > 0) {
                            logger.debug(`slicer ${retryMetadata.slicer_id} segment needs additional processing, ${resultObj.retryList.length}`);
                            getRetryData(retryArray, resultObj);
                        } else if (retryArray.length === 0) {
                            // data set complete of this slicer, check if its the last, if so
                            // emit all done
                            events.emit('slicer:recovery:enqueued');
                        } else {
                            // process the next in line
                            logger.debug('finished processing retry segment, continuing with the next');
                            getRetryData(retryArray);
                        }
                    });
            }
        }, 200);
    }

    function checkJobState(jobConfig) {
        const query = `ex_id:${jobConfig.ex_id} AND (state:error OR state:start)`;
        return stateStore.count(query, 0);
    }

    function allocateSlice(sliceRequest, slicerId, slicerOrder) {
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

    function createSlices(slicerFn, slicerId, lifecycle) {
        let hasCompleted = false;
        let isProcessing = false;
        let slicerOrder = 0;
        const isOnce = lifecycle === 'once';

        return function () {
            if (!isProcessing) {
                logger.trace(`slicer ${slicerId} is being called`);
                isProcessing = true;
                Promise.resolve(slicerFn())
                    .then((sliceRequest) => {
                        // not null or undefined
                        if (sliceRequest != null) {
                            if (_.isArray(sliceRequest)) {
                                logger.warn(`slicer for job: ${exId} is subslicing by key`);
                                slicerAnalytics.subslice_by_key += 1;
                                _.forEach(sliceRequest, (request) => {
                                    allocateSlice(request, slicerId, slicerOrder += 1);
                                });
                            } else {
                                allocateSlice(sliceRequest, slicerId, slicerOrder += 1);
                            }

                            isProcessing = false;
                        } else {
                            if (isOnce && !hasCompleted) {
                                events.emit('slicer:execution:finished');
                                hasCompleted = true;
                            }
                            isProcessing = false;
                        }
                    })
                    .catch((err) => {
                        // retries are handled internally by slicer
                        isProcessing = false;
                        const errMsg = `slicer for ex ${exId} had an error, shutting down job ${parseError(err)}`;
                        logger.error(errMsg);
                        const errorMeta = exStore.failureMeta(errMsg, slicerAnalytics);
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

    function parseQueueLength(reader, jobConfig) {
        let length = 10000;
        if (reader.slicerQueueLength) {
            if (typeof reader.slicerQueueLength !== 'function') {
                logger.error('slicerQueueLength on the reader must be a function, defaulting to 10000');
            } else {
                const results = reader.slicerQueueLength(jobConfig);
                if (results === 'QUEUE_MINIMUM_SIZE') {
                    dynamicQueueLength = true;
                    length = jobConfig.workers;
                } else if (_.isNumber(results) && results >= 1) {
                    length = results;
                }
            }
        }

        return length;
    }

    function logFinishedJob() {
        const end = moment();
        const time = (end - start) / 1000;

        slicerAnalytics.job_duration = time;

        if (job.jobConfig.analytics) {
            analyzeStats(logger, job.jobConfig.operations, analyticsData);
        }

        logger.info(`job ${job.jobConfig.name} has finished in ${time} seconds`);
    }

    function getScheduler(slicers) {
        const fnArray = [];
        slicers.forEach((slicerFn, index) => {
            fnArray.push(createSlices(slicerFn, index, job.jobConfig.lifecycle));
        });

        return fnArray;
    }


    function testContext(tempContext) {
        if (tempContext) {
            context = tempContext;
        }

        return {
            createSlices
        };
    }

    return {
        __test_context: testContext
    };
};
