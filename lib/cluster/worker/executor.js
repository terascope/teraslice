'use strict';

const _ = require('lodash');
const parseError = require('error_parser');
const Promise = require('bluebird');

module.exports = function module(context, messaging, executionContext, stateStore, analyticsStore) {
    const events = context.apis.foundation.getSystemEvents();
    const config = context.sysconfig.teraslice;
    const cluster = context.cluster;
    const exId = process.env.ex_id;
    const jobId = process.env.job_id;
    const ID = `${context.sysconfig.teraslice.hostname}__${cluster.worker.id}`;
    const queue = executionContext.queue;

    const recycle = _recycleFn();
    const host = messaging.getHostUrl();
    const finalShutdown = _.once(shutdown);

    const logger = context.apis.foundation.makeLogger({
        ex_id: exId,
        job_id: jobId,
        module: 'worker_executor',
        worker_id: ID
    });

    let isShuttingDown = false;
    let isDone = true;

    // this will be used to keep track of the previously sent message just in case of a disconnect
    let sentMessage = false;

    messaging.register({ event: 'worker:shutdown', callback: finalShutdown });

    messaging.register({
        event: 'assets:loaded',
        callback: ipcMessage => events.emit('execution:assets_loaded', ipcMessage)
    });

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

            _executeSlice(msg.payload, sliceLogger);
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
    // TODO rename initialize
    messaging.initialize();
    logger.info(`worker ${ID} is online, communicating with host: ${host}`);

    function _sliceCompleted(sliceResults, slice, msg, specData, sliceLogger) {
        // resultResponse may need to be checked in later functionality
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
                        _logMessage(sliceLogger, msg);
                    } else {
                        _logMessage(sliceLogger, msg, specData);
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

    function _retrySlice(slice, sliceLogger) {
        const maxRetries = executionContext.config.max_retries;
        let retryCount = 0;

       return (err) => {
            const errMsg = parseError(err);
            sliceLogger.error(`An error has occurred: ${errMsg}, message: `, slice);
            if (maxRetries) {
                    retryCount += 1;
                    if (retryCount >= maxRetries) {
                        sliceLogger.error('Max retires has been reached for: ', slice);
                        sliceFailed(err, slice, sliceLogger)
                            .finally(() => {
                                events.emit('slice:finalize', slice);
                                isDone = true;
                                recycle();
                            });
                    } else {
                        events.emit('slice:retry', slice);
                        _executeSlice(slice, sliceLogger);
                    }
            } else {
                // no retries, proceed to next slice
                sliceFailed(err, slice, sliceLogger)
                    .finally(() => {
                        events.emit('slice:finalize', slice);
                        isDone = true;
                        recycle();
                    });
            }
        };
    }

    function sliceFailed(err, slice, sliceLogger) {
        const errMsg = parseError(err);
        sentMessage = { worker_id: ID, slice, error: errMsg };
        events.emit('slice:failure', slice);
        return stateStore.updateState(slice, 'error', errMsg)
            .then(() => sliceLogger.error(`failed to process ${JSON.stringify(sentMessage)}, slice state has been marked as error`))
            .catch((updateError) => {
                const updateErrorMsg = parseError(updateError);
                sliceLogger.error(`An error has occurred while marking slice as failed: ${updateErrorMsg} , message: `, slice);
            });
    }


    function _executeSlice(slice, sliceLogger) {
        const msg = slice.request;
        let finalQueue = queue;
        let specData;

        if (executionContext.config.analytics) {
            specData = { time: [], size: [], memory: [] };

            finalQueue = queue.map(fn => fn.bind(null, specData));
        }

        Promise.reduce(finalQueue, (prev, fn) => Promise.resolve(prev)
            .then(data => fn(data, sliceLogger, msg)
            ), msg)
            .then(sliceResults => _sliceCompleted(sliceResults, slice, msg, specData, sliceLogger))
            .catch(_retrySlice)
    }

    // TODO consider rename
    function _logMessage(sliceLogger, msg, specData) {
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
                shutdownSequence.push(analyticsStore.shutdown);
                shutdownSequence.push(stateStore.shutdown);
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
    // TODO seperate messaging sending from recycle
    function _recycleFn() {
        const recycleWorker = executionContext.config.recycle_worker;
        const recycleWorkerRandomFactor = _.random(75, 100);
        let sliceCount = 0;

        return function () {
            if (recycleWorker) {
                sliceCount += 1;
                // recycle worker between 75% and 100% of executionContext.config.recycle_worker
                const recycleCount = Math.trunc((recycleWorkerRandomFactor / 100) * recycleWorker);
                if (sliceCount >= recycleCount && !isShuttingDown) {
                    logger.info(`worker: ${ID} recycled after processing ${sliceCount} slices`);
                    // still need to signal that slice completed and not be enqueued
                    sentMessage.isShuttingDown = true;
                    setTimeout(() => {
                        process.exit(42);
                    }, 100);
                }

                messaging.send({ to: 'execution_controller', message: 'worker:slice:complete', worker_id: ID, payload: sentMessage });

        };
    }
};
