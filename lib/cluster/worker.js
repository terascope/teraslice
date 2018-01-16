'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const parseError = require('error_parser');
const messagingFn = require('./services/messaging');


module.exports = function module(context) {
    const events = context.apis.foundation.getSystemEvents();
    const cluster = context.cluster;
    const config = context.sysconfig.teraslice;
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const ID = `${context.sysconfig.teraslice.hostname}__${cluster.worker.id}`;
    const executionRunner = require('./runners/execution')(context);
    const recycleWorkerRandomFactor = _.random(75, 100);

    let isDone = true;
    let isShuttingDown = false;
    let analyticsStore;
    let stateStore;
    let queue;
    let maxRetries;
    let executionContext;
    let recycle;

    // this will be used to keep track of the previously sent message just in case of a disconnect
    let sentMessage = false;

    // this will store errors and the number of retries
    const errorLog = {};

    const logger = context.apis.foundation.makeLogger({
        ex_id: exId,
        job_id: jobId,
        module: 'worker',
        worker_id: ID
    });
    // need ipc channels open before job construction
    const messaging = messagingFn(context, logger);

    // if worker cannot make client, job needs to shutdown, needs to be setup before executionRunner
    events.on('client:initialization:error', terminalShutdown);

    const host = messaging.getHostUrl();

    logger.info(`worker ${ID} is online, communicating with host: ${host}`);

    messaging.register({
        event: 'assets:loaded',
        callback: ipcMessage => events.emit('execution:assets_loaded', ipcMessage)
    });

    // set up listener
    messaging.register({
        event: 'slicer:slice:new',
        callback: (msg) => {
            isDone = false;
            // getting a slice means the previous message was handled
            sentMessage = false;
            logger.info(`received slice: ${msg.payload.slice_id}`);
            const sliceLogger = context.apis.foundation.makeLogger({
                ex_id: exId,
                job_id: jobId,
                module: 'slice',
                worker_id: ID,
                slice_id: msg.payload.slice_id
            });

            runSlice(msg.payload, sliceLogger);
        }
    });

    messaging.register({
        event: 'slicer:slice:recorded',
        callback: () => {
        // the sent message has been processed, so set it to false;
            logger.debug('slice has been marked as completed by slicer');
            sentMessage = false;
        }
    });

    messaging.register({
        event: 'network:error',
        callback: (err) => {
            events.emit('network:error');
            logger.error('Error in worker socket: ', err);
        }
    });

    messaging.register({
        event: 'network:disconnect',
        callback: (event) => {
            events.emit('network:disconnect');
            if (!isShuttingDown) {
                logger.error(`worker ${ID} has disconnected from slicer ex_id ${exId}`, event);
            }
        }
    });

    messaging.register({
        event: 'network:connect',
        callback: () => {
            if (sentMessage) {
                logger.warn('reconnecting to slicer, previous slice: ', sentMessage);
                sentMessage.retry = true;
                messaging.send({ to: 'execution_controller', message: 'worker:slice:complete', worker_id: ID, payload: sentMessage });
            } else {
                logger.debug(`a worker has made the initial connection to slicer ex_id: ${exId}`);
                messaging.send({ to: 'execution_controller', message: 'worker:ready', worker_id: ID, payload: { worker_id: ID } });
            }
        }
    });

    const finalShutdown = _.once(shutdown);

    messaging.register({ event: 'worker:shutdown', callback: finalShutdown });

    // to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    messaging.register({ event: 'process:SIGTERM', callback: noOP });
    messaging.register({ event: 'process:SIGINT', callback: noOP });

    Promise.resolve(require('./storage/assets')(context))
        .then(() =>
            // assets store is loaded so it can register under context.apis
            executionRunner.initialize(events, logger)
        )
        .then((_executionContext) => {
            executionContext = _executionContext;
            queue = _executionContext.queue;
            maxRetries = _executionContext.config.max_retries;
            recycle = recycleFn();
            return require('./storage/state')(context);
        })
        .then((store) => {
            stateStore = store;
            return require('./storage/analytics')(context);
        })
        .then((store) => {
            analyticsStore = store;
            logger.info(`connecting to host: ${host}`);
            messaging.initialize();
        })
        .catch((err) => {
            const errMsg = `worker: ${ID} could not instantiate for execution: ${exId}, error: ${parseError(err)}`;
            logger.error(errMsg);
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

    function isReady(res, slice, msg, specData, sliceLogger) {
        // res may return null if no data was received
        return stateStore.updateState(slice, 'completed', slice.index)
            .then(() => {
                events.emit('slice:success', slice);
                sentMessage = { worker_id: ID, slice, analytics: specData };
                sliceLogger.info('completed slice: ', slice);
                if (isShuttingDown) {
                    sentMessage.isShuttingDown = true;
                }

                if (specData) {
                    if (executionContext.reporter) {
                        executionContext.reporter(context, executionContext.config, specData);
                        logMessage(sliceLogger, msg);
                    } else {
                        logMessage(sliceLogger, msg, specData);
                        return analyticsStore.log(executionContext, slice, specData)
                            .catch((err) => {
                                const errMsg = parseError(err);
                                logger.error(`Failure when storing analytics: ${errMsg}`);
                            });
                    }
                }
                return true;
            })
            .finally(() => {
                events.emit('slice:finalize');
                isDone = true;
                recycle();
            });
    }

    function runSlice(slice, sliceLogger) {
        function sliceFailed(err) {
            const errMsg = parseError(err);
            sentMessage = { worker_id: ID, slice, error: errMsg };
            events.emit('slice:failure', sentMessage);
            return stateStore.updateState(slice, 'error', errMsg)
                .then(() => sliceLogger.error(`failed to process ${JSON.stringify(sentMessage)}, slice state has been marked as error`))
                .catch((updateError) => {
                    const updateErrorMsg = parseError(updateError);
                    sliceLogger.error(`An error has occurred while marking slice as failed: ${updateErrorMsg} , message: `, slice);
                });
        }

        const msg = slice.request;
        const sliceID = slice.slice_id;

        let finalQueue = queue;
        let specData;

        if (executionContext.config.analytics) {
            specData = { time: [], size: [], memory: [] };

            finalQueue = queue.map(fn => fn.bind(null, specData));
        }

        Promise.reduce(finalQueue, (prev, fn) => Promise.resolve(prev)
            .then(data => fn(data, sliceLogger, msg)
            ), msg)
            .then(res => isReady(res, slice, msg, specData, sliceLogger))
            .catch((err) => {
                const errMsg = parseError(err);
                sliceLogger.error(`An error has occurred: ${errMsg}, message: `, slice);
                if (maxRetries) {
                    // checking if error has occurred before
                    if (errorLog[sliceID]) {
                        errorLog[sliceID] += 1;

                        if (errorLog[sliceID] >= maxRetries) {
                            sliceLogger.error('Max retires has been reached for: ', slice);

                            sliceFailed(err)
                                .finally(() => {
                                    events.emit('slice:finalize');
                                    isDone = true;
                                    recycle();
                                });
                        } else {
                            events.emit('slice:retry');
                            runSlice(slice, sliceLogger);
                        }
                    } else {
                        events.emit('slice:retry');
                        errorLog[sliceID] = 1;
                        runSlice(slice, sliceLogger);
                    }
                } else {
                    // no retries, proceed to next slice
                    sliceFailed(err)
                        .finally(() => {
                            events.emit('slice:finalize');
                            isDone = true;
                            recycle();
                        });
                }
            });
    }


    function shutdown() {
        let counter = config.shutdown_timeout;
        isShuttingDown = true;
        events.emit('worker:shutdown');
        const shutDownInterval = setInterval(() => {
            logger.trace(`is done with current slice: ${isDone}, shutdown counter: ${counter}`);
            if (isDone || counter <= 0) {
                logger.info('shutting down');
                clearInterval(shutDownInterval);
                const shutdownSequence = [];
                if (analyticsStore !== undefined) {
                    shutdownSequence.push(analyticsStore.shutdown);
                }
                if (stateStore !== undefined) {
                    shutdownSequence.push(stateStore.shutdown);
                }

                shutdownSequence.push(logger.flush);

                Promise.reduce(shutdownSequence, (prev, curr) => Promise.resolve(prev)
                    .then(() => curr())
                    .catch((err) => {
                        const errMsg = parseError(err);
                        logger.error(`Error shutting down store ${prev.name}`, errMsg);
                        return curr();
                    }))
                    .then(() => {
                        process.exit();
                    })
                    .catch((err) => {
                        const errMsg = parseError(err);
                        logger.error(errMsg);
                        // TODO: the log might never be called to stdout with process.exit here
                        process.exit();
                    });
            } else {
                if (counter % 6000 === 0) {
                    logger.info(`shutdown sequence initiated, but is still processing. Will force shutdown in ${counter / 1000} seconds`);
                }

                counter -= 1000;
            }
        }, 1000);
    }

    function terminalShutdown(errEV) {
        logger.error(`Terminal error, shutting down execution ${exId}`);
        events.emit('worker:shutdown');
        messaging.respond({ message: 'execution:error:terminal', error: errEV.error, ex_id: exId });
    }

    function recycleFn() {
        let sliceCount = 0;
        const recycleWorker = executionContext.config.recycle_worker;
        return function () {
            if (recycleWorker) {
                sliceCount += 1;
                // recycle worker between 75% and 100% of executionContext.config.recycle_worker
                const recycleCount = Math.trunc((recycleWorkerRandomFactor / 100) * recycleWorker);
                if (sliceCount >= recycleCount && !isShuttingDown) {
                    logger.info(`worker: ${ID} recycled after processing ${sliceCount} slices`);
                    // still need to signal that slice completed and not be enqueued
                    sentMessage.isShuttingDown = true;
                    messaging.send({ to: 'execution_controller', message: 'worker:slice:complete', worker_id: ID, payload: sentMessage });
                    setTimeout(() => {
                        process.exit(42);
                    }, 100);
                } else {
                    messaging.send({ to: 'execution_controller', message: 'worker:slice:complete', worker_id: ID, payload: sentMessage });
                }
            } else {
                messaging.send({ to: 'execution_controller', message: 'worker:slice:complete', worker_id: ID, payload: sentMessage });
            }
        };
    }

    function logMessage(sliceLogger, msg, specData) {
        const str = 'analytics for slice ';
        let dataStr = '';

        if (typeof msg === 'string') {
            dataStr = `${msg}, `;
        } else {
            _.forOwn(msg, (value, key) => {
                dataStr += `${key} : ${value} `;
            });
        }
        _.forOwn(specData, (value, key) => {
            dataStr += `${key} : ${value} `;
        });

        sliceLogger.info(str + dataStr);
    }
};
