'use strict';

const _ = require('lodash');
const parseError = require('error_parser');
const Promise = require('bluebird');

module.exports = function module(context, messaging, executionRunner, stateStore, analyticsStore) {
    const events = context.apis.foundation.getSystemEvents();
    const config = context.sysconfig.teraslice;

    // This will be filled in by the runner.
    let executionContext;
    let recycle;

    let exId = process.env.ex_id;
    let jobId = process.env.job_id;
    const ID = `${context.sysconfig.teraslice.hostname}__${context.cluster.worker.id}`;

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

    function run() {
        return executionRunner.initialize()
            .then((exContext) => {
                executionContext = exContext;
                recycle = _recycleFn();
                // Now that we have a valid execution context we can
                // start listening for work.
                messaging.listen();
                logger.info(`worker ${ID} is online, communicating with host: ${messaging.getHostUrl()}`);
            })
            .catch((err) => {
                logger.error('error initializing execution', err.message);
                return Promise.reject(`error initializing execution: ${err.message}`);
            });
    }

    messaging.register({
        event: 'slicer:slice:new',
        callback: (msg) => {
            isDone = false;
            // getting a slice means the previous message was handled
            sentMessage = false;
            logger.info(`received slice: ${msg.payload.slice_id}`);

            _processSlice(msg.payload);
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
            const errMsg = parseError(err);
            events.emit('network:error');
            logger.error(`Error in worker socket, error: ${errMsg}`);
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
                messaging.send({
                    to: 'execution_controller',
                    message: 'worker:slice:complete',
                    worker_id: ID,
                    payload: sentMessage
                });
            } else {
                logger.debug(`a worker has made the initial connection to slicer ex_id: ${exId}`);
                messaging.send({
                    to: 'execution_controller',
                    message: 'worker:ready',
                    worker_id: ID,
                    payload: { worker_id: ID }
                });
            }
        }
    });

    function _sliceCompleted(sliceResults, sliceMetaData, slice, specData, sliceLogger) {
        // resultResponse may need to be checked in later functionality
        return stateStore.updateState(sliceMetaData, 'completed')
            .then(() => {
                events.emit('slice:success', sliceMetaData);
                sentMessage = { worker_id: ID, slice: sliceMetaData, analytics: specData };
                sliceLogger.info('completed slice: ', sliceMetaData);
                if (isShuttingDown) {
                    sentMessage.isShuttingDown = true;
                }
                if (specData) {
                    _logSliceStats(sliceLogger, slice, specData);
                    return analyticsStore.log(executionContext, sliceMetaData, specData)
                        .catch((err) => {
                            const errMsg = parseError(err);
                            logger.error(`Failure when storing analytics: ${errMsg}`);
                        });
                }
                return true;
            })
            .finally(() => _sliceCleanup(slice));
    }

    function _sliceFailed(err, slice, sliceLogger) {
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

    function _processSlice(slice) {
        const sliceLogger = context.apis.foundation.makeLogger({
            ex_id: exId,
            job_id: jobId,
            module: 'slice',
            worker_id: ID,
            slice_id: slice.slice_id
        });

        let operations = executionContext.queue;
        let specData;

        if (executionContext.config.analytics) {
            specData = { time: [], size: [], memory: [] };
            operations = operations.map(fn => fn.bind(null, specData));
        }
        const retrySliceFn = _retrySliceModule(slice, operations, sliceLogger, specData);

        _executeSlice(slice, operations, sliceLogger, specData)
            .catch(retrySliceFn);
    }


    function _executeSlice(slice, operations, sliceLogger, specData) {
        const msg = slice.request;
        return Promise.reduce(operations, (prev, fn) => Promise.resolve(prev)
            .then(data => fn(data, sliceLogger, msg)
            ), msg)
            .then((sliceResults) => {
                _sliceCompleted(sliceResults, slice, msg, specData, sliceLogger);
            });
    }

    function _retrySliceModule(slice, operations, sliceLogger, specData) {
        const maxRetries = executionContext.config.max_retries;
        let retryCount = 0;

        return function retrySlice(err) {
            const errMsg = parseError(err);
            sliceLogger.error(`An error has occurred: ${errMsg}, message: `, slice);
            if (maxRetries) {
                retryCount += 1;
                if (retryCount >= maxRetries) {
                    sliceLogger.error('Max retires has been reached for: ', slice);
                    _sliceFailed(err, slice, sliceLogger)
                        .finally(_sliceCleanup(slice));
                } else {
                    events.emit('slice:retry', slice);
                    _executeSlice(slice, operations, sliceLogger, specData)
                        .catch(retrySlice);
                }
            } else {
                // no retries, proceed to next slice
                _sliceFailed(err, slice, sliceLogger)
                    .finally(_sliceCleanup(slice));
            }
        };
    }

    function _logSliceStats(sliceLogger, msg, specData) {
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
        return new Promise((resolve) => {
            const shutDownInterval = setInterval(() => {
                logger.trace(`is done with current slice: ${isDone}, shutdown counter: ${counter}`);
                if (isDone || counter <= 0) {
                    logger.info('shutting down');
                    clearInterval(shutDownInterval);

                    Promise.resolve()
                        .then(logger.flush)
                        .finally(resolve(true));
                } else {
                    if (counter % 6000 === 0) {
                        logger.info(`shutdown sequence initiated, but is still processing. Will force shutdown in ${counter / 1000} seconds`);
                    }

                    counter -= 1000;
                }
            }, 1000);
        });
    }

    function _recycleFn() {
        const recycleWorker = executionContext.config.recycle_worker;
        const recycleWorkerRandomFactor = _.random(75, 100);
        let sliceCount = 0;

        return function cycle(sentMsg) {
            if (recycleWorker) {
                sliceCount += 1;
                // recycle worker between 75% and 100% of executionContext.config.recycle_worker
                const recycleCount = Math.trunc((recycleWorkerRandomFactor / 100) * recycleWorker);
                if (sliceCount >= recycleCount && !isShuttingDown) {
                    logger.info(`worker: ${ID} recycled after processing ${sliceCount} slices`);
                    // still need to signal that slice completed and not be enqueued
                    sentMsg.isShuttingDown = true;
                    setTimeout(() => {
                        events.emit('worker:recycle');
                    }, 100);
                }
            }
        };
    }

    function _sliceCleanup(slice) {
        events.emit('slice:finalize', slice);
        isDone = true;
        recycle(sentMessage);

        messaging.send({
            to: 'execution_controller',
            message: 'worker:slice:complete',
            worker_id: ID,
            payload: sentMessage
        });
    }

    function testContext(_exId, _jobId) {
        if (_exId) exId = _exId;
        if (_jobId) jobId = _jobId;

        return {
            _lastMessage: () => sentMessage,
            _sliceFailed,
            _sliceCompleted,
            _recycleFn,
            _retrySliceModule
        };
    }

    return {
        shutdown,
        run,
        __test_context: testContext
    };
};
