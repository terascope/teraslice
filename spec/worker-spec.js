'use strict';

const eventsModule = require('events');
const _ = require('lodash');
const Promise = require('bluebird');

const eventEmitter = new eventsModule.EventEmitter();

describe('Worker', () => {
    const workerExecutorModule = require('../lib/cluster/worker/executor');
    const messagingEvents = {};

    let updatedSlice;
    let analyticsData;
    let sentMsg;
    let errorMsg;
    let debugMsg;
    let logMsg;
    let warnMsg;
    let loggerConfig;

    const logger = {
        error(err) {
            errorMsg = err;
        },
        info(info) {
            logMsg = info;
        },
        warn(msg) {
            warnMsg = msg;
        },
        trace() {},
        debug(msg) {
            debugMsg = msg;
        },
        flush() {}
    };

    const context = {
        sysconfig: {
            teraslice: {
                hostname: 'testHostName',
                shutdown_timeout: 60000
            }
        },
        apis: {
            foundation: {
                makeLogger: (_config) => {
                    loggerConfig = _config;
                    return logger;
                },
                getSystemEvents: () => eventEmitter
            },
            registerAPI: () => {}
        },
        cluster: {
            worker: {
                id: 'someID'
            }
        },
        logger,
        __test_assignment: 'worker'
    };
    const messaging = {
        register: (obj) => {
            messagingEvents[obj.event] = obj.callback;
        },
        getHostUrl: () => 'someURL',
        send: _sentMsg => sentMsg = _sentMsg,
        listen: () => {}
    };
    const executionContext = {
        queue: [],
        config: {
            max_retries: 3,
            analytics: true,
            recycle_worker: false
        }
    };
    const stateStore = {
        updateState: (slice, type, errMsg) => {
            updatedSlice = { slice, type, errMsg };
            return Promise.resolve(true);
        }
    };
    const analyticsStore = {
        log: (_executionContext, slice, specData) => {
            analyticsData = { executionContext: _executionContext, slice, specData };
            return Promise.resolve(true);
        }
    };

    function makeEmitter() {
        const newEmitter = new eventsModule.EventEmitter();
        context.apis.foundation.getSystemEvents = () => newEmitter;
        return newEmitter;
    }

    function waitFor(timeout) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, timeout);
        });
    }
    const mockJob = JSON.stringify(require('../examples/jobs/data_generator.json'));

    function instantiateModule(_executionContext, exId, jobId) {
        const execution = _executionContext || _.cloneDeep(executionContext);
        context.__test_job = mockJob;
        context.__test_assignment = 'worker';
        const worker = workerExecutorModule(context, messaging, stateStore, analyticsStore);
        const testContext = worker.__test_context(execution, exId, jobId);
        return { worker, testContext };
    }

    it('can load without throwing', () => {
        expect(() => instantiateModule()).not.toThrowError();
        const module = instantiateModule();
        const worker = module.worker;
        const testModule = module.testContext;
        expect(module).toBeDefined();
        expect(typeof module).toEqual('object');
        expect(worker.shutdown).toBeDefined();
        expect(typeof worker.shutdown).toEqual('function');
        expect(testModule).toBeDefined();
        expect(typeof worker.__test_context).toEqual('function');
    });

    it('registers messsaging events', () => {
        instantiateModule();
        expect(messagingEvents['assets:loaded']).toBeDefined();
        expect(typeof messagingEvents['assets:loaded']).toEqual('function');
        expect(messagingEvents['slicer:slice:new']).toBeDefined();
        expect(typeof messagingEvents['slicer:slice:new']).toEqual('function');
        expect(messagingEvents['slicer:slice:recorded']).toBeDefined();
        expect(typeof messagingEvents['slicer:slice:recorded']).toEqual('function');
        expect(messagingEvents['network:error']).toBeDefined();
        expect(typeof messagingEvents['network:error']).toEqual('function');
        expect(messagingEvents['network:disconnect']).toBeDefined();
        expect(typeof messagingEvents['network:disconnect']).toEqual('function');
        expect(messagingEvents['network:connect']).toBeDefined();
        expect(typeof messagingEvents['network:connect']).toEqual('function');
    });

    it('assets loaded event', (done) => {
        const events = makeEmitter();
        const data = { some: 'assetMetaData' };
        let innerEventCalled = false;
        let respData;
        instantiateModule();

        events.on('execution:assets_loaded', (resp) => {
            innerEventCalled = true;
            respData = resp;
        });

        messagingEvents['assets:loaded'](data);

        waitFor(10)
            .then(() => {
                expect(innerEventCalled).toEqual(true);
                expect(respData).toEqual(data);
                done();
            });
    });

    it('transmits network errors', (done) => {
        const events = makeEmitter();
        let innerEventCalled = false;
        instantiateModule();

        events.on('network:error', () => {
            innerEventCalled = true;
        });

        messagingEvents['network:error']('some error');

        waitFor(10)
            .then(() => {
                expect(innerEventCalled).toEqual(true);
                expect(errorMsg).toEqual('Error in worker socket, error: some error');
                done();
            });
    });

    it('can mark slices as failed', (done) => {
        const events = makeEmitter();
        let innerEventCalled = false;
        const module = instantiateModule();
        const sliceId = 'some5Lic8';
        const error = new Error('some slice error');
        const sliceFailed = module.testContext._sliceFailed;
        const lastMessage = module.testContext._lastMessage;

        const slice = { payload: { slice_id: sliceId, some: 'data' } };

        events.on('slice:failure', () => {
            innerEventCalled = true;
        });

        sliceFailed(error, slice, logger);

        waitFor(10)
            .then(() => {
                expect(innerEventCalled).toEqual(true);
                expect(errorMsg).toEqual(`failed to process ${JSON.stringify(lastMessage())}, slice state has been marked as error`);
                expect(updatedSlice).toBeDefined();
                expect(updatedSlice.slice).toEqual(slice);
                expect(updatedSlice.type).toEqual('error');
                expect(updatedSlice.errMsg).toEqual(error.stack);
            })
            .finally(done);
    });

    it('can mark slices as completed', (done) => {
        const events = makeEmitter();
        const module = instantiateModule();
        const sliceId = 'some5Lic8';
        const sliceCompleted = module.testContext._sliceCompleted;
        let gotSuccess = false;
        let gotFinalize = false;

        const sliceMetaData = {
            slice_id: sliceId,
            request: { some: 'data' }
        };
        const slice = sliceMetaData.request;
        const specData = { time: [12, 24], size: [50, 50], memory: [1234, 5678] };

        const endingMsg = {
            to: 'execution_controller',
            message: 'worker:slice:complete',
            worker_id: 'testHostName__someID',
            payload: {
                worker_id: 'testHostName__someID',
                slice: {
                    slice_id: 'some5Lic8',
                    request: { some: 'data' }
                },
                analytics: {
                    time: [12, 24],
                    size: [50, 50],
                    memory: [1234, 5678]
                }
            },
        };

        events.on('slice:success', (results) => {
            gotSuccess = results;
        });

        events.on('slice:finalize', () => {
            gotFinalize = true;
        });

        Promise.resolve()
            .then(() => Promise.all([
                sliceCompleted(null, sliceMetaData, slice, specData, logger),
                waitFor(30)
            ]))
            .then(() => {
                expect(gotSuccess).toEqual(sliceMetaData);
                expect(gotFinalize).toEqual(true);
                expect(sentMsg).toEqual(endingMsg);
            })
            .catch(fail)
            .finally(done);
    });

    it('will emit recycle after so many invocations', (done) => {
        const events = makeEmitter();
        const myExecution = _.cloneDeep(executionContext);
        myExecution.config.recycle_worker = 2;
        const recycle = instantiateModule(myExecution).testContext._recycleFn();
        const sentMessage = {};
        let gotEvent = false;

        events.on('worker:recycle', () => {
            gotEvent = true;
        });

        recycle(sentMessage);
        expect(sentMessage).toEqual(sentMessage);
        expect(gotEvent).toEqual(false);

        waitFor(200)
            .then(() => {
                expect(sentMessage).toEqual({ isShuttingDown: true });
                expect(gotEvent).toEqual(true);
                done();
            });
    });

    it('can shutdown', (done) => {
        const events = makeEmitter();
        let innerEventCalled = false;
        const worker = instantiateModule().worker;

        events.on('worker:shutdown', () => {
            innerEventCalled = true;
        });

        Promise.all([worker.shutdown(), waitFor(10)])
            .then(() => {
                expect(innerEventCalled).toEqual(true);
            })
            .catch(fail)
            .finally(done);
    });

    it('can process slices', (done) => {
        const myExecution = _.cloneDeep(executionContext);

        function makeData() {
            return () => Promise.resolve([{ data: 'someData' }, { data: 'otherData' }]);
        }
        function mapData() {
            return results => results.map(obj => obj.data);
        }

        myExecution.queue = [makeData, mapData];
        const exId = '1234';
        const jobId = '5678';
        const events = makeEmitter();
        const lastMessage = instantiateModule(myExecution, exId, jobId).testContext._lastMessage;
        const slice = { slice_id: 'as35g' };
        let sliceSuccess = false;

        events.on('slice:success', () => {
            sliceSuccess = true;
        });

        Promise.all([
            messagingEvents['slicer:slice:new']({ payload: slice }),
            waitFor(10)
        ])
            .then(() => {
                expect(loggerConfig).toEqual({
                    ex_id: exId,
                    job_id: jobId,
                    module: 'slice',
                    worker_id: 'testHostName__someID',
                    slice_id: slice.slice_id
                });

                expect(updatedSlice.slice).toEqual(slice);
                expect(updatedSlice.type).toEqual('completed');
                expect(sliceSuccess).toEqual(true);
                expect(lastMessage()).toEqual({
                    worker_id: 'testHostName__someID',
                    slice: { slice_id: 'as35g' },
                    analytics: { time: [], size: [], memory: [] }
                });
            })
            .catch(fail)
            .finally(done);
    });

    it('can keep track of last sent messages', (done) => {
        const exId = '1234';
        const jobId = '5678';
        const lastMessage = instantiateModule(null, exId, jobId).testContext._lastMessage;
        const slice = { slice_id: 'as35g' };

        Promise.all([
            messagingEvents['slicer:slice:new']({ payload: slice }),
            waitFor(10)
        ])
            .then(() => {
                const theLastMessage = lastMessage();
                expect(theLastMessage).toEqual({
                    worker_id: 'testHostName__someID',
                    slice: { slice_id: 'as35g' },
                    analytics: { time: [], size: [], memory: [] }
                });
                // this should add the retry key to last sent message
                messagingEvents['network:connect']();
                const newLastMessage = Object.assign({}, theLastMessage, { retry: true });
                expect(lastMessage()).toEqual(newLastMessage);
                expect(sentMsg).toEqual({
                    to: 'execution_controller',
                    message: 'worker:slice:complete',
                    worker_id: 'testHostName__someID',
                    payload: newLastMessage
                });

                messagingEvents['slicer:slice:recorded']();
                expect(lastMessage()).toEqual(false);
                messagingEvents['network:connect']();
                expect(sentMsg).toEqual({
                    to: 'execution_controller',
                    message: 'worker:ready',
                    worker_id: 'testHostName__someID',
                    payload: { worker_id: 'testHostName__someID' }
                });
            })
            .catch(fail)
            .finally(done);
    });

    it('can retry slice executions', (done) => {
        const exId = '1234';
        const jobId = '5678';
        const slice = { slice_id: 'as35g' };
        const events = makeEmitter();
        const retrySliceModule = instantiateModule(null, exId, jobId).testContext._retrySliceModule;

        const errEvent = new Error('an error');
        const retrySlice = retrySliceModule(slice, [() => Promise.reject('an error'), () => Promise.reject('an error')], logger, {});
        let sliceRetry = false;

        events.on('slice:retry', (response) => {
            sliceRetry = response;
        });

        Promise.all([retrySlice(errEvent), waitFor(10)])
            .then(() => {
                expect(sliceRetry).toEqual(slice);
                return Promise.all([retrySlice(errEvent), retrySlice(errEvent), waitFor(50)]);
            })
            .then(() => {
                expect(updatedSlice.type).toEqual('error');
                expect(updatedSlice.slice).toEqual(slice);
            })
            .catch(fail)
            .finally(done);
    });

    it('can get a network disconnect event', (done) => {
        const exId = '1234';
        const jobId = '5678';
        const events = makeEmitter();
        instantiateModule(null, exId, jobId);

        let gotDisconnectEvent = false;
        const disconnEvent = { some: 'event' };
        const finalErrorMessage = `worker testHostName__someID has disconnected from slicer ex_id ${exId}`;

        events.on('network:disconnect', () => {
            gotDisconnectEvent = true;
        });

        Promise.all([messagingEvents['network:disconnect'](disconnEvent), waitFor(10)])
            .then(() => {
                expect(gotDisconnectEvent).toEqual(true);
                expect(errorMsg).toEqual(finalErrorMessage);
            })
            .catch(fail)
            .finally(done);
    });
});
