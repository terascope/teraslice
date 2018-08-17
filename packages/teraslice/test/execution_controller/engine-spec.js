'use strict';

const events = require('events');
const Promise = require('bluebird');
const _ = require('lodash');
const engineCode = require('../../lib/cluster/execution_controller/engine');

const eventEmitter = new events.EventEmitter();

describe('execution engine', () => {
    let loggerErrMsg;
    let debugMsg;
    let logInfo;
    let warnMsg;

    const logger = {
        error(err) {
            loggerErrMsg = err;
        },
        info(info) {
            logInfo = info;
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

    let testSlices;
    let clientCounter = 15;

    const context = {
        apis: {
            foundation: {
                makeLogger: () => logger,
                getSystemEvents: () => eventEmitter
            },
            registerAPI: () => {}
        },
        sysconfig: {
            teraslice: {
                worker_disconnect_timeout: 500,
                slicer_timeout: 500
            }
        },
        foundation: {
            getEventEmitter: () => eventEmitter
        },
        logger
    };
    let messagingEvents = {};
    let sentMsg = null;
    let sentMsgs = [];
    let executionOperationsUpdate = null;
    let exStatus = null;
    let updateState = {};
    let analyticsData = { };
    let respondingMessage = {};
    let messageResponses = {};

    const messaging = {
        send: (msg) => {
            sentMsg = msg;
            sentMsgs.push(msg);
            return Promise.resolve(respondingMessage);
        },
        getClientCounts: () => clientCounter,
        register: (obj) => {
            messagingEvents[obj.event] = obj.callback;
        },
        listen: () => {},
        respond: (incoming = {}, outgoing = {}) => {
            const msgId = incoming.__msgId;
            messageResponses[msgId] = {
                incoming,
                outgoing,
            };
        }
    };

    const executionAnalytics = {
        getAnalytics: () => analyticsData,
        set: () => {},
        increment: () => {},
        shutdown: () => {}
    };

    const slicerAnalytics = {
        analyzeStats: () => {},
        addStats: () => {}
    };

    const exStore = {
        executionMetaData: () => {},
        setStatus: (exId, status) => {
            exStatus = status;
            return Promise.resolve(true);
        },
        shutdown: () => {},
        update: (exId, obj) => { executionOperationsUpdate = obj; }
    };

    const stateStore = {
        executionStartingSlice: () => {},
        recoverSlices: () => {
            const data = testSlices.slice();
            testSlices = [];
            return Promise.resolve(data);
        },
        createState: () => {},
        count: () => Promise.resolve(0),
        shutdown: () => {},
        updateState: (slice, state) => {
            updateState[state] = slice;
        }
    };

    const executionContext = {
        config: {
            slicers: 2,
            analytics: true,
            max_retries: 4,
            lifecycle: 'once',
            slicer_port: 3000,
            operations: [{ _op: 'testEngine' }],
        },
        slicer: {
            slicerQueueLength: () => 100000,
            newSlicer: () => Promise.resolve([() => null])
        }
    };

    const recovery = {
        recoveryComplete: () => true,
        getSlicerStartingPosition: () => Promise.resolve({ starting: 'point' }),
        initialize: () => {},
        newSlicer: () => Promise.resolve([() => null])
    };

    // slicer asynchronously puts in a queue, so we are mimicking it
    function callSlicer(fn) {
        return new Promise((resolve) => {
            fn();
            setTimeout(() => {
                resolve(true);
            }, 10);
        });
    }

    function waitFor(timeout) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, timeout);
        });
    }

    function makeEmitter() {
        const newEmitter = new events.EventEmitter();
        context.apis.foundation.getSystemEvents = () => newEmitter;
        return newEmitter;
    }

    function makeEngine(_execution, _testRecovery) {
        sentMsg = null;
        sentMsgs.length = 0;
        executionOperationsUpdate = null;
        exStatus = null;
        const execution = _execution || executionContext;
        const myEmitter = makeEmitter();
        let testRecovery = false;
        if (_testRecovery) testRecovery = _testRecovery;
        const engine = engineCode(context, messaging, exStore, stateStore);
        const testContext = engine.__test_context(
            execution,
            executionAnalytics,
            slicerAnalytics,
            recovery,
            1234,
            testRecovery
        );
        return { engine, testContext, myEmitter };
    }

    beforeEach(() => {
        loggerErrMsg = null;
        debugMsg = null;
        logInfo = null;
        warnMsg = null;
        testSlices = null;
        clientCounter = 15;
        messagingEvents = {};
        sentMsg = null;
        sentMsgs = [];

        executionOperationsUpdate = null;
        exStatus = null;
        updateState = {};
        analyticsData = { failed: 1, processed: 5 };
        respondingMessage = {};
        messageResponses = {};
    });

    it('can instantiate', (done) => {
        const { engine } = makeEngine();

        expect(engine).toBeDefined();
        expect(engine.initialize).toBeDefined();

        engine.initialize()
            .then(() => {
                expect(logInfo).toEqual('execution: 1234 has initialized and is listening on port 3000');
            })
            .then(engine.shutdown())
            .catch(fail)
            .finally(() => { done(); });
    });

    it('registers messaging events', () => {
        makeEngine();
        expect(messagingEvents['cluster:execution:pause']).toBeDefined();
        expect(typeof messagingEvents['cluster:execution:pause']).toEqual('function');
        expect(messagingEvents['cluster:execution:resume']).toBeDefined();
        expect(typeof messagingEvents['cluster:execution:resume']).toEqual('function');
        expect(messagingEvents['worker:ready']).toBeDefined();
        expect(typeof messagingEvents['worker:ready']).toEqual('function');
        expect(messagingEvents['worker:slice:complete']).toBeDefined();
        expect(typeof messagingEvents['worker:slice:complete']).toEqual('function');
        expect(messagingEvents['network:disconnect']).toBeDefined();
        expect(typeof messagingEvents['network:disconnect']).toEqual('function');
        expect(messagingEvents['assets:loaded']).toBeDefined();
        expect(typeof messagingEvents['assets:loaded']).toEqual('function');
    });

    it('can set and adjust queue length', () => {
        const { testContext } = makeEngine();
        const errExEnv = {
            slicer: { slicerQueueLength: 10 }
        };

        const errExEnv2 = {
            slicer: { slicerQueueLength: () => -10 }
        };

        const exEnv = {
            slicer: { slicerQueueLength: () => 10 }
        };

        const exEnv2 = {
            slicer: { slicerQueueLength: () => 'QUEUE_MINIMUM_SIZE' },
            config: { workers: 7 }
        };

        expect(testContext._getQueueLength()).toEqual(undefined);

        testContext._setQueueLength(errExEnv);

        expect(loggerErrMsg).toEqual('slicerQueueLength on the reader must be a function, defaulting to 10000');
        expect(testContext._getQueueLength()).toEqual(10000);
        // Expect not to change while errExEnv is in use
        testContext._adjustSlicerQueueLength();
        expect(testContext._getQueueLength()).toEqual(10000);
        // Expect not to change while errExEnv2 is in use
        testContext._setQueueLength(errExEnv2);
        expect(testContext._getQueueLength()).toEqual(10000);

        testContext._setQueueLength(exEnv);
        expect(testContext._getQueueLength()).toEqual(10);
        // Expect not to change, dynamicQueueLength should be false
        testContext._adjustSlicerQueueLength();
        expect(testContext._getQueueLength()).toEqual(10);

        testContext._setQueueLength(exEnv2);
        expect(testContext._getQueueLength()).toEqual(7);
        // Expect to equal executionModules.messaging.getClientCounts => 15
        testContext._adjustSlicerQueueLength();
        expect(testContext._getQueueLength()).toEqual(15);

        clientCounter = 22;

        testContext._adjustSlicerQueueLength();
        expect(testContext._getQueueLength()).toEqual(22);

        clientCounter = 2;

        testContext._adjustSlicerQueueLength();
        expect(testContext._getQueueLength()).toEqual(22);
    });

    it('can enqueue and dequeue workers', () => {
        const { workerQueue } = makeEngine().testContext;
        const someWorker = { worker_id: 'someWorker' };

        expect(workerQueue).toBeDefined();
        expect(workerQueue.size()).toEqual(0);

        messagingEvents['worker:ready']({ payload: someWorker });
        expect(workerQueue.size()).toEqual(1);

        messagingEvents['network:disconnect']('ping timeout', someWorker.worker_id);
        expect(workerQueue.size()).toEqual(0);
    });

    it('can enqueue slices', () => {
        const engineTest = makeEngine().testContext;
        const { slicerQueue } = engineTest;
        const allocateSlice = engineTest._allocateSlice;
        const slice = { some: 'slice' };

        expect(slicerQueue).toBeDefined();
        expect(slicerQueue.size()).toEqual(0);

        allocateSlice(slice, 23, 48);
        expect(slicerQueue.size()).toEqual(1);

        const results = slicerQueue.dequeue();
        expect(results.request).toEqual(slice);
        expect(results.slicer_id).toEqual(23);
        expect(results.slicer_order).toEqual(48);
        expect(typeof results.slice_id).toEqual('string');
        expect(typeof results._created).toEqual('string');
        expect(slicerQueue.size()).toEqual(0);
    });

    it('can register slice completions', () => {
        const exId = '1234';
        const testEngine = makeEngine();
        const { workerQueue, cache } = testEngine.testContext;
        const { myEmitter } = testEngine;
        const sliceComplete = messagingEvents['worker:slice:complete'];
        let gotSliceSuccess = false;
        let gotSliceFailure = false;

        const slice1 = {
            __msgId: _.uniqueId('msg-id-'),
            payload: {
                worker_id: 'some-worker-id',
                slice: {
                    slice_id: _.uniqueId('slice-id-'),
                    slice_order: 1,
                }
            }
        };
        const slice2 = {
            __msgId: _.uniqueId('msg-id-'),
            payload: {
                worker_id: _.uniqueId('worker-id-'),
                slice: {
                    slice_id: _.uniqueId('slice-id-'),
                    slice_order: 2,
                },
                error: 'some error'
            }
        };

        const slice3 = {
            __msgId: _.uniqueId('msg-id-'),
            payload: {
                worker_id: _.uniqueId('worker-id-'),
                slice: {
                    slice_id: _.uniqueId('slice-id-'),
                    slice_order: 3,
                },
                retry: true,
                analytics: true
            }
        };

        const slice4 = {
            __msgId: _.uniqueId('msg-id-'),
            payload: {
                worker_id: _.uniqueId('worker-id-'),
                slice: {
                    slice_id: _.uniqueId('slice-id-'),
                    slice_order: 4,
                },
                some: 'data',
                isShuttingDown: true,
            }
        };

        myEmitter.on('slice:success', () => {
            gotSliceSuccess = true;
        });

        myEmitter.on('slice:failure', () => {
            gotSliceFailure = true;
        });

        expect(workerQueue.size()).toEqual(0);

        sliceComplete(slice1, slice1.payload.worker_id);

        expect(gotSliceSuccess).toEqual(true);
        expect(messageResponses[slice1.__msgId]).toEqual({
            incoming: slice1,
            outgoing: {
                payload: {
                    slice_id: slice1.payload.slice.slice_id,
                    recorded: true
                }
            }
        });

        const cachekey = JSON.stringify({
            slice: slice1.payload.slice,
            worker_id: slice1.payload.worker_id,
        });
        expect(cache.get(cachekey)).toEqual(true);

        expect(workerQueue.size()).toEqual(1);

        sliceComplete(slice2, slice2.payload.worker_id);
        expect(gotSliceFailure).toEqual(true);

        expect(workerQueue.size()).toEqual(2);

        sliceComplete(slice3, slice3.payload.worker_id);
        expect(warnMsg).toEqual(`worker: ${slice3.payload.worker_id} has rejoined slicer: ${exId}`);

        expect(workerQueue.size()).toEqual(3);

        sliceComplete(slice4, slice4.payload.worker_id);
        expect(workerQueue.size()).toEqual(3);
    });

    it('can safely call slice complete twice', () => {
        const testEngine = makeEngine();
        const { workerQueue, cache } = testEngine.testContext;
        const { myEmitter } = testEngine;
        const sliceComplete = messagingEvents['worker:slice:complete'];
        let gotSliceSuccess = false;
        let gotSliceFailure = false;

        const slice = {
            __msgId: _.uniqueId('msg-id-'),
            payload: {
                worker_id: 'some-worker-id',
                slice: {
                    slice_id: _.uniqueId('slice-id-'),
                    slice_order: 1,
                }
            }
        };

        myEmitter.on('slice:success', () => {
            gotSliceSuccess = true;
        });

        myEmitter.on('slice:failure', () => {
            gotSliceFailure = true;
        });

        expect(workerQueue.size()).toEqual(0);

        sliceComplete(slice, slice.payload.worker_id);

        const cachekey = JSON.stringify({
            slice: slice.payload.slice,
            worker_id: slice.payload.worker_id,
        });
        expect(cache.get(cachekey)).toEqual(true);

        expect(workerQueue.size()).toEqual(1);

        expect(gotSliceSuccess).toEqual(true);

        expect(messageResponses[slice.__msgId]).toEqual({
            incoming: slice,
            outgoing: {
                payload: {
                    slice_id: slice.payload.slice.slice_id,
                    recorded: true
                }
            }
        });

        gotSliceSuccess = false;

        sliceComplete(slice, slice.payload.worker_id);

        expect(workerQueue.size()).toEqual(1);

        expect(gotSliceSuccess).toEqual(false);
        expect(gotSliceFailure).toEqual(false);

        expect(warnMsg).toEqual(`worker: ${slice.payload.worker_id} already marked slice ${slice.payload.slice.slice_id} as complete`);
    });

    it('can register slicers', () => {
        const engineTest = makeEngine();
        const registerSlicers = engineTest.testContext._registerSlicers;
        const { myEmitter } = engineTest;

        const slicers = [() => {}];
        const errSlicers = {
            slicer: () => {}
        };

        expect(() => {
            registerSlicers(errSlicers, 'recovery');
        }).toThrowError('newSlicer from module testEngine needs to return an array of slicers');

        expect(() => {
            registerSlicers(slicers, 'recovery');
        }).not.toThrowError();
        // make sure error logic is not registered in recovery, recovery mangages itself internally
        expect(myEmitter.listenerCount('slice:failure')).toEqual(0);


        expect(() => {
            registerSlicers(slicers);
        }).not.toThrowError();

        expect(myEmitter.listenerCount('slice:failure')).toEqual(1);

        myEmitter.emit('slice:failure');
        expect(exStatus).toEqual('failing');
    });

    it('execution can recover', (done) => {
        const engineTest = makeEngine(null, true);
        const executionRecovery = engineTest.testContext._executionRecovery;
        const { myEmitter } = engineTest;

        function sendEvent(time) {
            return waitFor(time)
                .then(() => {
                    myEmitter.emit('execution:recovery:complete', { starting: 'point' });
                });
        }

        Promise.all([executionRecovery(), sendEvent(150)])
            .spread(data => expect(data).toEqual({ starting: 'point' }))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('terminal error marks job as failed', (done) => {
        const { executionFailed } = makeEngine().testContext;
        const myError = new Error('an error');

        Promise.all([executionFailed(myError), waitFor(20)])
            .then(() => {
                expect(exStatus).toEqual('failed');
                expect(sentMsg).toEqual({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: 1234,
                    payload: { set_status: true }
                });
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('failed slice can recover to running status in persistent mode', (done) => {
        const newExecution = _.cloneDeep(executionContext);
        newExecution.config.lifecycle = 'persistent';
        newExecution.config.probation_window = 100;
        const engineTest = makeEngine(newExecution);
        const registerSlicers = engineTest.testContext._registerSlicers;
        const { myEmitter } = engineTest;

        registerSlicers([() => {}], false);
        myEmitter.emit('slice:failure');
        waitFor(10)
            .then(() => {
                expect(exStatus).toEqual('failing');
                myEmitter.emit('slice:failure');
                // imitate more slices being processed
                analyticsData.processed = 20;
                return waitFor(150);
            })
            .then(() => {
                expect(exStatus).toEqual('running');
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('slicer init retry will attempt to create slicer', (done) => {
        const oldSlicer = executionContext.slicer.newSlicer;
        let errorCounter = 0;
        function slicerError() {
            if (errorCounter < 2) {
                errorCounter += 1;
                return Promise.reject('an error occurred during slicer initialization');
            }
            return Promise.resolve([() => 'all done']);
        }
        executionContext.slicer.newSlicer = slicerError;

        const slicerInitRetry = makeEngine().testContext._slicerInitRetry;
        const myError = new Error('an error');

        slicerInitRetry(myError)
            .then((slicerArray) => {
                expect(slicerArray[0]()).toEqual('all done');
            })
            .catch(fail)
            .finally(() => {
                executionContext.slicer.newSlicer = oldSlicer;
                done();
            });
    });

    it('can pass along assets:loaded event', () => {
        const { myEmitter } = makeEngine();
        const assetsLoaded = messagingEvents['assets:loaded'];
        let assetsHaveLoaded = false;
        const data = { asset: 'data' };

        myEmitter.on('execution:assets_loaded', (results) => {
            assetsHaveLoaded = results;
        });

        assetsLoaded(data);

        expect(assetsHaveLoaded).toEqual(data);
    });

    it('watchdogs can call', (done) => {
        const oldClientCounter = clientCounter;
        clientCounter = 0;
        const engineTextContext = makeEngine().testContext;
        const exId = 1234;
        const startWorkerConnectionWatchDog = engineTextContext._startWorkerConnectionWatchDog;
        const startWorkerDisconnectWatchDog = engineTextContext._startWorkerDisconnectWatchDog;

        Promise.all([startWorkerConnectionWatchDog(), waitFor(750)])
            .spread(() => {
                expect(exStatus).toEqual('failed');
                expect(sentMsg).toEqual({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: 1234,
                    payload: { set_status: true }
                });
                expect(loggerErrMsg).toEqual(`A worker has not connected to a slicer for ex: ${exId}, shutting down execution`);
                return Promise.all([
                    startWorkerDisconnectWatchDog(),
                    waitFor(750),
                    messagingEvents['worker:ready']({
                        payload: {
                            worker_id: 1,
                        }
                    })
                ]);
            })
            .then(() => {
                expect(exStatus).toEqual('failed');
                expect(sentMsg).toEqual({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: 1234,
                    payload: { set_status: true }
                });
                expect(loggerErrMsg).toEqual(`all workers from slicer #${exId} have disconnected`);
            })
            .catch(fail)
            .finally(() => {
                clientCounter = oldClientCounter;
                done();
            });
    });

    it('can update operations', () => {
        const { myEmitter } = makeEngine();
        const updateData = [{ _op: 1 }];

        myEmitter.emit('slicer:execution:update', { update: updateData });
        expect(executionOperationsUpdate).toEqual({ operations: updateData });
    });

    it('can create a scheduler', (done) => {
        // prevent slicer all done event collisions
        const engineTest = makeEngine();
        const { myEmitter } = engineTest;
        const getScheduler = engineTest.testContext._getScheduler;
        const { slicerQueue } = engineTest.testContext;
        const allDone = () => null;
        const makesSlices = () => ({ some: 'data' });
        const makesArrayOfSlices = () => [{ id: 1 }, { id: 2 }];
        const slicerError = () => {
            throw new Error('im an error');
        };
        let isASlicerDone = false;

        myEmitter.on('slicer:finished', () => {
            isASlicerDone = true;
        });

        const slicers = getScheduler([makesSlices, makesArrayOfSlices, allDone, slicerError]);

        expect(slicers.length).toEqual(4);
        expect(slicerQueue.size()).toEqual(0);

        callSlicer(slicers[0])
            .then(() => {
                expect(slicerQueue.size()).toEqual(1);
                const slice = slicerQueue.dequeue();
                expect(slice.request).toEqual({ some: 'data' });
                return callSlicer(slicers[1]);
            })
            .then(() => {
                expect(slicerQueue.size()).toEqual(2);
                const slice1 = slicerQueue.dequeue();
                expect(slice1.request).toEqual({ id: 1 });
                const slice2 = slicerQueue.dequeue();
                expect(slice2.request).toEqual({ id: 2 });
                return callSlicer(slicers[2]);
            })
            .then(() => {
                expect(slicerQueue.size()).toEqual(0);
                expect(isASlicerDone).toEqual(true);
                return callSlicer(slicers[3]);
            })
            .then(() => {
                expect(sentMsg.to).toEqual('cluster_master');
                expect(sentMsg.message).toEqual('execution:error:terminal');
                return true;
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can initialize, pause, resume and shutdown', (done) => {
        const spyObj = {
            firstSlicer: () => Promise.resolve({ some: 'data' }),
            secondSlicer: () => Promise.resolve({ some: 'data' })
        };

        spyOn(spyObj, 'firstSlicer').and.callThrough();
        spyOn(spyObj, 'secondSlicer').and.callThrough();
        executionContext.slicer = {
            newSlicer: () => [spyObj.firstSlicer, spyObj.secondSlicer],
            slicerQueueLength: () => 100000
        };

        const engineTest = makeEngine();
        const { engine } = engineTest;
        const { slicerQueue } = engineTest.testContext;

        let currentSlicerCount;
        let prevSlicerCount;
        let currFirstCallCount;
        let prevFirstCallCount = 0;
        let currSecondCallCount;
        let prevSecondCallCount = 0;

        currFirstCallCount = spyObj.firstSlicer.calls.count();
        currSecondCallCount = spyObj.firstSlicer.calls.count();
        expect(currFirstCallCount).toEqual(0);
        expect(currSecondCallCount).toEqual(0);

        currentSlicerCount = slicerQueue.size();
        prevSlicerCount = currentSlicerCount;

        expect(currentSlicerCount).toEqual(0);

        const pause = messagingEvents['cluster:execution:pause'];
        const resume = messagingEvents['cluster:execution:resume'];
        const { shutdown } = engine;
        // for pausing/stopping, the async slicers may be already calling so counts may
        // increase by 1 or 2 since there are two slicers
        function compareCounts(prev, next) {
            if (prev === next || prev + 2 === next || prev + 1 === next) return true;
            return false;
        }

        engine.initialize()
            .then(() => {
                expect(debugMsg).toEqual('starting the slicer engine');
                return waitFor(10);
            })
            .then(() => {
                currentSlicerCount = slicerQueue.size();
                expect(currentSlicerCount > prevSlicerCount).toEqual(true);
                prevSlicerCount = currentSlicerCount;

                currFirstCallCount = spyObj.firstSlicer.calls.count();
                currSecondCallCount = spyObj.firstSlicer.calls.count();

                expect(currFirstCallCount > prevFirstCallCount).toEqual(true);
                expect(currSecondCallCount > prevSecondCallCount).toEqual(true);

                prevFirstCallCount = currFirstCallCount;
                prevSecondCallCount = currSecondCallCount;
                return pause();
            })
            .then(() => {
                currentSlicerCount = slicerQueue.size();
                expect(compareCounts(prevSlicerCount, currentSlicerCount)).toEqual(true);

                currFirstCallCount = spyObj.firstSlicer.calls.count();
                currSecondCallCount = spyObj.firstSlicer.calls.count();
                expect(compareCounts(prevFirstCallCount, currFirstCallCount)).toEqual(true);
                expect(compareCounts(prevSecondCallCount, currSecondCallCount)).toEqual(true);

                resume();
                return waitFor(20);
            })
            .then(() => {
                currentSlicerCount = slicerQueue.size();
                expect(currentSlicerCount > prevSlicerCount).toEqual(true);
                prevSlicerCount = currentSlicerCount;

                currFirstCallCount = spyObj.firstSlicer.calls.count();
                currSecondCallCount = spyObj.firstSlicer.calls.count();

                expect(currFirstCallCount > prevFirstCallCount).toEqual(true);
                expect(currSecondCallCount > prevSecondCallCount).toEqual(true);

                prevFirstCallCount = currFirstCallCount;
                prevSecondCallCount = currSecondCallCount;

                return shutdown();
            })
            .then(() => {
                currentSlicerCount = slicerQueue.size();
                expect(compareCounts(prevSlicerCount, currentSlicerCount)).toEqual(true);

                currFirstCallCount = spyObj.firstSlicer.calls.count();
                currSecondCallCount = spyObj.firstSlicer.calls.count();

                expect(compareCounts(prevFirstCallCount, currFirstCallCount)).toEqual(true);
                expect(compareCounts(prevSecondCallCount, currSecondCallCount)).toEqual(true);
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can complete when slicers are finished', (done) => {
        // prevent slicer all done event collisions
        const engineTest = makeEngine();
        const { myEmitter } = engineTest;
        const { slicerQueue } = engineTest.testContext;

        let allDoneCounter = 0;
        const allDone = () => null;

        myEmitter.on('slicer:finished', () => {
            allDoneCounter += 1;
        });

        engineTest.testContext._registerSlicers([allDone, allDone]);
        engineTest.testContext._engineSetup();

        waitFor(20)
            .then(() => {
                expect(allDoneCounter).toEqual(2);
                // remove all slices to act like everything is done
                while (slicerQueue.size()) {
                    slicerQueue.dequeue();
                }
                // act like all workers have shutdown
                clientCounter = 0;
                return waitFor(150);
            })
            .then(() => {
                expect(sentMsg.to).toEqual('cluster_master');
                expect(sentMsg.message).toEqual('execution:finished');
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('executionShutdown', (done) => {
        const engineTest = makeEngine();
        const { myEmitter } = engineTest;
        const executionShutdown = engineTest.engine.shutdown;
        const exId = 1234;
        let gotStopEvent = false;

        myEmitter.on('execution:stop', () => { gotStopEvent = true; });

        Promise.all([executionShutdown(), waitFor(50)])
            .then(() => {
                expect(logInfo).toEqual(`slicer for execution: ${exId} has received a shutdown notice`);
                expect(gotStopEvent).toEqual(true);
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can log error counts at end of execution', (done) => {
        const engineTest = makeEngine();
        const executionCompleted = engineTest.testContext._executionCompleted;
        const exId = 1234;
        stateStore.count = () => Promise.resolve(2);

        Promise.all([executionCompleted(), waitFor(50)])
            .then(() => {
                expect(loggerErrMsg).toEqual(`execution: ${exId} had 2 slice failures during processing`);
                expect(exStatus).toEqual('failed');
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can send slices to specific workers', (done) => {
        const engineTest = makeEngine();
        const { myEmitter } = engineTest;
        const { slicerQueue, workerQueue, _enqueueWorker } = engineTest.testContext;
        const slice1 = { request: { some: 'slice' } };
        const slice2 = Object.assign({}, slice1, { request: { request_worker: 3 } });
        const slice3 = Object.assign({}, slice1, { request: { request_worker: 99 } });

        const worker1 = { worker_id: 1 };
        const worker2 = { worker_id: 2 };
        const worker3 = { worker_id: 3 };

        let invalidSlice = null;

        function workerQueueList() {
            const results = [];
            workerQueue.each(worker => results.push(worker));
            return results;
        }

        engineTest.testContext._engineSetup();

        myEmitter.on('slice:invalid', (data) => { invalidSlice = data; });

        _enqueueWorker(worker1);
        _enqueueWorker(worker2);
        _enqueueWorker(worker3);

        waitFor(10)
            .then(() => {
                // We expect that no workers have been allocated yet
                expect(workerQueue.size()).toEqual(3);
                slicerQueue.enqueue(slice1);
                return waitFor(10);
            })
            .then(() => {
                expect(workerQueue.size()).toEqual(2);
                expect(sentMsg).toEqual({
                    to: 'worker',
                    message: 'slicer:slice:new',
                    payload: slice1,
                    address: 1,
                    response: true
                });
                expect(workerQueueList()).toEqual([worker2, worker3]);
                slicerQueue.enqueue(slice2);
                return waitFor(10);
            })
            .then(() => {
                expect(workerQueue.size()).toEqual(1);
                expect(sentMsg).toEqual({
                    to: 'worker',
                    message: 'slicer:slice:new',
                    payload: slice2,
                    address: 3,
                    response: true
                });
                expect(workerQueueList()).toEqual([worker2]);
                slicerQueue.enqueue(slice3);
                // check that there was no invalid state records so far
                expect(invalidSlice).toEqual(null);
                expect(updateState).toEqual({});
                return waitFor(10);
            })
            .then(() => {
                expect(workerQueue.size()).toEqual(1);
                expect(invalidSlice).toEqual(slice3.request);
                expect(updateState).toEqual({ invalid: slice3.request });
                expect(workerQueueList()).toEqual([worker2]);
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('should not send two slices to the same worker', (done) => {
        const engineTest = makeEngine();
        const { myEmitter } = engineTest;
        const { workerQueue, slicerQueue, _enqueueWorker } = engineTest.testContext;

        let invalidSlice = null;

        engineTest.testContext._engineSetup();

        myEmitter.on('slice:invalid', (data) => { invalidSlice = data; });

        _enqueueWorker({ worker_id: 1 });
        _enqueueWorker({ worker_id: 1 });
        _enqueueWorker({ worker_id: 2 });

        expect(workerQueue.size()).toEqual(2);
        expect(sentMsgs).toEqual([]);

        slicerQueue.enqueue({
            request: {
                some: 'slice'
            }
        });
        slicerQueue.enqueue({
            request: {
                some: 'slice'
            }
        });
        waitFor(10).then(() => {
            expect(workerQueue.size()).toEqual(0);
            expect(sentMsgs.length).toEqual(2);
            expect(sentMsgs).toEqual([
                {
                    to: 'worker',
                    message: 'slicer:slice:new',
                    payload: {
                        request: {
                            some: 'slice'
                        }
                    },
                    address: 1,
                    response: true
                },
                {
                    to: 'worker',
                    message: 'slicer:slice:new',
                    payload: {
                        request: {
                            some: 'slice'
                        }
                    },
                    address: 2,
                    response: true
                }
            ]);
            expect(invalidSlice).toEqual(null);
            done();
        }).catch(fail);
    });

    it('should not send two slices to the same worker when specifying the worker id', (done) => {
        const engineTest = makeEngine();
        const { myEmitter } = engineTest;
        const { workerQueue, slicerQueue, _enqueueWorker } = engineTest.testContext;

        let invalidSlice = null;

        function workerQueueList() {
            const results = [];
            workerQueue.each(worker => results.push(worker));
            return results;
        }

        engineTest.testContext._engineSetup();

        myEmitter.on('slice:invalid', (data) => { invalidSlice = data; });

        _enqueueWorker({ worker_id: 1 });
        _enqueueWorker({ worker_id: 1 });
        _enqueueWorker({ worker_id: 2 });

        expect(workerQueue.size()).toEqual(2);
        expect(sentMsgs).toEqual([]);

        slicerQueue.enqueue({
            request: {
                request_worker: 1,
                some: 'slice'
            }
        });
        slicerQueue.enqueue({
            request: {
                request_worker: 1,
                some: 'slice'
            }
        });
        waitFor(10).then(() => {
            expect(workerQueue.size()).toEqual(1);
            expect(sentMsgs.length).toEqual(1);
            expect(sentMsgs).toEqual([
                {
                    to: 'worker',
                    message: 'slicer:slice:new',
                    payload: {
                        request: {
                            request_worker: 1,
                            some: 'slice'
                        }
                    },
                    address: 1,
                    response: true
                }
            ]);
            expect(workerQueueList()).toEqual([{ worker_id: 2 }]);
            expect(invalidSlice).toEqual({
                request_worker: 1,
                some: 'slice'
            });
            done();
        }).catch(fail);
    });

    it('should workerQueue extract should not be extract the same worker twice', () => {
        const engineTest = makeEngine();
        const { workerQueue, _enqueueWorker } = engineTest.testContext;

        engineTest.testContext._engineSetup();

        _enqueueWorker({ worker_id: 1 });
        _enqueueWorker({ worker_id: 1 });
        _enqueueWorker({ worker_id: 2 });

        expect(workerQueue.size()).toEqual(2);
        expect(workerQueue.extract('worker_id', 1)).toEqual({ worker_id: 1 });
        expect(workerQueue.extract('worker_id', 1)).toEqual(null);
        expect(workerQueue.size()).toEqual(1);
        expect(workerQueue.extract('worker_id', 2)).toEqual({ worker_id: 2 });
        expect(workerQueue.size()).toEqual(0);
    });

    it('should re-enqueue a slice that was over provisioned to a worker', (done) => {
        const engineTest = makeEngine();
        const { slicerQueue, _sendSlice } = engineTest.testContext;
        const returningSlice = { zero: 'zero' };
        const slice1 = { one: 'one' };
        const slice2 = { two: 'two' };
        const slice3 = { three: 'three' };
        const workerId = 'someId';
        const returningResponse = {
            to: 'execution_controller',
            message: 'worker:slice:over_allocated',
            worker_id: workerId,
            payload: returningSlice
        };

        slicerQueue.enqueue(slice1);
        slicerQueue.enqueue(slice2);
        slicerQueue.enqueue(slice3);

        expect(slicerQueue.size()).toEqual(3);
        respondingMessage = { payload: { willProcess: false, slice: returningResponse } };
        Promise.resolve()
            .then(() => _sendSlice(returningSlice, workerId))
            .then(() => {
                expect(slicerQueue.size()).toEqual(4);
                expect(slicerQueue.dequeue()).toEqual(returningSlice);
                expect(slicerQueue.dequeue()).toEqual(slice1);
                expect(slicerQueue.size()).toEqual(2);
            })
            .catch(fail)
            .finally(() => { done(); });
    });
});
