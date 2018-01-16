'use strict';

const engineCode = require('../../lib/cluster/execution_controller/engine');
const events = require('events');
const Promise = require('bluebird');
const moment = require('moment');

const eventEmitter = new events.EventEmitter();
const eventEmitter2 = new events.EventEmitter();
const eventEmitter3 = new events.EventEmitter();

fdescribe('execution engine', () => {
    let loggerErrMsg;
    let debugMsg;
    const logger = {
        error(err) {
            loggerErrMsg = err;
        },
        info() {
        },
        warn() {
        },
        trace() {
        },
        debug(msg) {
            debugMsg = msg;
        }
    };
    let sentMsg = null;
    let testSlices;
    let clientCounter = 15;

    const context = {
        apis: {
            foundation: {
                makeLogger: () => logger,
                getSystemEvents: () => eventEmitter
            }
        }
    };
    const messaging = {
        send: (msg) => {
            sentMsg = msg;
        },
        getClientCounts: () => clientCounter,
        register: () => {}
    };
    const executionAnalytics = {
        getAnalytics: () => ({}),
        set: () => {
        },
        increment: () => {
        }
    };
    const slicerAnalytics = {
        analyzeStats: () => {}
    };
    const exStore = {
        failureMetaData: () => {
        },
        setStatus: () => Promise.resolve(true)
    };
    const stateStore = {
        executionStartingSlice: () => {
        },
        recoverSlices: () => {
            const data = testSlices.slice();
            testSlices = [];
            return Promise.resolve(data);
        },
        createState: () => {},
        count: () => Promise.resolve(0)
    };
    const executionContext = {
        config: {
            slicers: 2,
            analytics: true,
            lifecycle: 'once',
            operations: [{ _op: 'testEngine' }],
        }
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

    function makeEngine() {
        return engineCode(context, messaging, exStore, stateStore, executionContext);
    }

    /* initialize,
        pause,
        resume,
        shutdown */

    it('can instantiate', () => {
        const engine = makeEngine();

        expect(engine).toBeDefined();
        expect(engine.initialize).toBeDefined();
        expect(engine.registerSlicers).toBeDefined();
        expect(engine.setQueueLength).toBeDefined();
        expect(engine.adjustQueueLength).toBeDefined();
        expect(engine.enqueueWorker).toBeDefined();
        expect(engine.removeWorker).toBeDefined();
        expect(engine.enqueueSlice).toBeDefined();
        expect(engine.pause).toBeDefined();
        expect(engine.resume).toBeDefined();
        expect(engine.shutdown).toBeDefined();
    });

    it('can set and adjust queue length', () => {
        const engine = makeEngine();
        const testContext = engine.__test_context(executionAnalytics, slicerAnalytics);
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

        engine.setQueueLength(errExEnv);

        expect(loggerErrMsg).toEqual('slicerQueueLength on the reader must be a function, defaulting to 10000');
        expect(testContext._getQueueLength()).toEqual(10000);
        // Expect not to change while errExEnv is in use
        engine.adjustQueueLength();
        expect(testContext._getQueueLength()).toEqual(10000);
        // Expect not to change while errExEnv2 is in use
        engine.setQueueLength(errExEnv2);
        expect(testContext._getQueueLength()).toEqual(10000);

        engine.setQueueLength(exEnv);
        expect(testContext._getQueueLength()).toEqual(10);
        // Expect not to change, dynamicQueueLength should be false
        engine.adjustQueueLength();
        expect(testContext._getQueueLength()).toEqual(10);

        engine.setQueueLength(exEnv2);
        expect(testContext._getQueueLength()).toEqual(7);
        // Expect to equal executionModules.messaging.getClientCounts => 15
        engine.adjustQueueLength();
        expect(testContext._getQueueLength()).toEqual(15);

        clientCounter = 22;

        engine.adjustQueueLength();
        expect(testContext._getQueueLength()).toEqual(22);

        clientCounter = 2;

        engine.adjustQueueLength();
        expect(testContext._getQueueLength()).toEqual(22);
    });

    it('can enqueue and dequeue workers', () => {
        const engine = makeEngine();
        const workerQueue = engine.__test_context(executionAnalytics, slicerAnalytics).workerQueue;
        const someWorker = { id: 'someWorker' };

        expect(workerQueue).toBeDefined();
        expect(workerQueue.size()).toEqual(0);

        engine.enqueueWorker(someWorker);

        expect(workerQueue.size()).toEqual(1);

        engine.removeWorker('someWorker');

        expect(workerQueue.size()).toEqual(0);
    });

    it('can enqueue slices', () => {
        const engine = makeEngine();
        const slicerQueue = engine.__test_context(executionAnalytics, slicerAnalytics).slicerQueue;
        const slice = { some: 'slice' };

        expect(slicerQueue).toBeDefined();
        expect(slicerQueue.size()).toEqual(0);

        engine.enqueueSlice(slice);

        expect(slicerQueue.size()).toEqual(1);
        expect(slicerQueue.dequeue()).toEqual(slice);
        expect(slicerQueue.size()).toEqual(0);
    });

    it('can register slicers', () => {
        const engine = makeEngine();
        engine.__test_context(executionAnalytics, slicerAnalytics);
        const slicers = [() => {}];
        const errSlicers = {
            slicer: () => {}
        };

        expect(() => {
            engine.registerSlicers(errSlicers);
        }).toThrowError('newSlicer from module testEngine needs to return an array of slicers');

        expect(() => {
            engine.registerSlicers(slicers);
        }).not.toThrowError();
    });

    it('can create a slice allocation', () => {
        const engine = makeEngine();
        const testContext = engine.__test_context(executionAnalytics, slicerAnalytics);
        const allocateSlice = testContext._allocateSlice;
        const slicerQueue = testContext.slicerQueue;
        const startTime = moment();
        const endTime = moment(startTime).add(1, 'h');
        const sliceRequest = { start: startTime, end: endTime, size: 2000 };
        const slicerId = 2;
        const sliceOrder = 12932;

        expect(slicerQueue.size()).toEqual(0);
        allocateSlice(sliceRequest, slicerId, sliceOrder);
        expect(slicerQueue.size()).toEqual(1);

        const slice = slicerQueue.dequeue();

        expect(slice).toBeDefined();
        expect(typeof slice).toEqual('object');
        expect(slice.request).toEqual(sliceRequest);
        expect(slice.slicer_id).toEqual(slicerId);
        expect(slice.slicer_order).toEqual(sliceOrder);
        expect(slice.slice_id).toBeDefined();
        expect(typeof slice.slice_id).toEqual('string');

        expect(slice._created).toBeDefined();
        expect(moment(slice._created).isSameOrAfter(startTime)).toEqual(true);
    });

    it('can create a scheduler', (done) => {
        const engine = makeEngine();
        const getScheduler = engine.__test_context(executionAnalytics, slicerAnalytics)._getScheduler;
        const slicerQueue = engine.__test_context(executionAnalytics, slicerAnalytics).slicerQueue;
        const allDone = () => null;
        const makesSlices = () => ({ some: 'data' });
        const makesArrayOfSlices = () => [{ id: 1 }, { id: 2 }];
        const slicerError = () => {
            throw new Error('im an error');
            return false;
        };
        let isASlicerDone = false;

        eventEmitter.on('slicer:finished', () => {
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
            .finally(done);
    });

    fit('can initialize, pause, resume and shutdown', (done) => {
        const spyObj = {
            firstSlicer: () => ({ some: 'data' }),
            secondSlicer: () => ({ some: 'data' })
        };

        spyOn(spyObj, 'firstSlicer').and.callThrough();
        spyOn(spyObj, 'secondSlicer').and.callThrough();
        executionContext.slicer = {
            newSlicer: () => [spyObj.firstSlicer, spyObj.secondSlicer],
            slicerQueueLength: () => 100000
        };

        // prevent slicer all done event collisions
        context.apis.foundation.getSystemEvents = () => eventEmitter2;

        const engine = makeEngine();
        const slicerQueue = engine.__test_context(executionAnalytics, slicerAnalytics).slicerQueue;

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

        engine.initialize()
            .then(() => {
                expect(debugMsg).toEqual('starting the slicer engine');
                return waitFor(10);
            })
            .then(() => {
                currentSlicerCount = slicerQueue.size();
                expect(currentSlicerCount > prevSlicerCount).toEqual(true);
                /*prevSlicerCount = currentSlicerCount;

                currFirstCallCount = spyObj.firstSlicer.calls.count();
                currSecondCallCount = spyObj.firstSlicer.calls.count();

                expect(currFirstCallCount > prevFirstCallCount).toEqual(true);
                expect(currSecondCallCount > prevSecondCallCount).toEqual(true);

                prevFirstCallCount = currFirstCallCount;
                prevSecondCallCount = currSecondCallCount;*/

                return engine.pause();
            })
            .then(() => {
                /*currentSlicerCount = slicerQueue.size();
                expect(currentSlicerCount === prevSlicerCount).toEqual(true);

                currFirstCallCount = spyObj.firstSlicer.calls.count();
                currSecondCallCount = spyObj.firstSlicer.calls.count();

                expect(currFirstCallCount === prevFirstCallCount).toEqual(true);
                expect(currSecondCallCount === prevSecondCallCount).toEqual(true);*/

                engine.resume();
                return waitFor(20);
            })
            .then(() => {
                /*currentSlicerCount = slicerQueue.size();
                expect(currentSlicerCount > prevSlicerCount).toEqual(true);
                prevSlicerCount = currentSlicerCount;

                currFirstCallCount = spyObj.firstSlicer.calls.count();
                currSecondCallCount = spyObj.firstSlicer.calls.count();

                expect(currFirstCallCount > prevFirstCallCount).toEqual(true);
                expect(currSecondCallCount > prevSecondCallCount).toEqual(true);

                prevFirstCallCount = currFirstCallCount;
                prevSecondCallCount = currSecondCallCount;*/

                return engine.shutdown();
            })
            .then(() => {
                /*currentSlicerCount = slicerQueue.size();
                expect(currentSlicerCount === prevSlicerCount).toEqual(true);

                currFirstCallCount = spyObj.firstSlicer.calls.count();
                currSecondCallCount = spyObj.firstSlicer.calls.count();

                expect(currFirstCallCount === prevFirstCallCount).toEqual(true);
                expect(currSecondCallCount === prevSecondCallCount).toEqual(true);*/
            })
            .catch(fail)
            .finally(done);
    });

    it('can complete when slicers are finished', (done) => {
        // prevent slicer all done event collisions
        context.apis.foundation.getSystemEvents = () => eventEmitter3;
        const engine = makeEngine();
        const slicerQueue = engine.__test_context(executionAnalytics, slicerAnalytics).slicerQueue;

        let allDoneCounter = 0;
        const exEnv = {
            slicer: { slicerQueueLength: () => 100000 }
        };

        const allDone = () => null;

        eventEmitter3.on('slicer:finished', () => {
            allDoneCounter += 1;
        });

        engine.setQueueLength(exEnv);
        engine.registerSlicers([allDone, allDone]);
        engine.initialize();

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
            .finally(done);
    });
});
