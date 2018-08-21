'use strict';

const { EventEmitter } = require('events');
const Promise = require('bluebird');
const _ = require('lodash');
const { newFormattedDate } = require('../../lib/utils/date_utils');
const engineCode = require('../../lib/cluster/execution_controller/engine');

describe('execution engine', () => {
    function makeTestContext(testConfig = {}) {
        const {
            lifecycle = 'once',
            probation_window = 60000, // eslint-disable-line
            testRecovery,
            slicer,
        } = testConfig;

        const _test = {};
        _test.errMsg = null;
        _test.debugMsg = null;
        _test.infoMsg = null;
        _test.warnMsg = null;

        const logger = {
            error(err) {
                _test.errMsg = err;
            },
            info(info) {
                _test.infoMsg = info;
            },
            warn(msg) {
                _test.warnMsg = msg;
            },
            trace() {},
            debug(msg) {
                _test.debugMsg = msg;
            },
            flush() {
                return Promise.resolve();
            }
        };

        _test.testSlices = null;
        _test.clientCounter = 15;
        _test.eventEmitter = new EventEmitter();

        _test.context = {
            apis: {
                foundation: {
                    makeLogger: () => logger,
                    getSystemEvents: () => _test.eventEmitter
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
                getEventEmitter: () => _test.eventEmitter
            },
            logger
        };

        _test.messagingEvents = {};
        _test.sentMsg = null;
        _test.sentMsgs = [];
        _test.executionOperationsUpdate = null;
        _test.exStatus = null;
        _test.updateState = {};
        _test.analyticsData = {
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
            started: newFormattedDate()
        };
        _test.respondingMessage = {};
        _test.messageResponses = {};

        _test.messaging = {
            send: (msg) => {
                _test.sentMsg = msg;
                _test.sentMsgs.push(msg);
                return Promise.resolve(_test.respondingMessage);
            },
            getClientCounts: () => _test.clientCounter,
            register: (obj) => {
                _test.messagingEvents[obj.event] = obj.callback;
            },
            listen: () => {},
            respond: (incoming = {}, outgoing = {}) => {
                const msgId = incoming.__msgId;
                _test.messageResponses[msgId] = {
                    incoming,
                    outgoing,
                };
            }
        };

        _test.executionAnalytics = {
            getAnalytics: () => _.cloneDeep(_test.analyticsData),
            set: (key, value) => {
                _test.analyticsData[key] = value;
            },
            increment: (key) => {
                _test.analyticsData[key] += 1;
            },
            shutdown: () => {}
        };

        _test.slicerAnalytics = {
            analyzeStats: () => {},
            addStats: () => {}
        };

        _test.exStore = {
            executionMetaData: () => {},
            setStatus: (exId, status) => {
                _test.exStatus = status;
                return Promise.resolve(true);
            },
            shutdown: () => {},
            update: (exId, obj) => { _test.executionOperationsUpdate = obj; }
        };

        _test.stateStore = {
            executionStartingSlice: () => {},
            recoverSlices: () => {
                const data = _test.testSlices.slice();
                _test.testSlices = [];
                return Promise.resolve(data);
            },
            createState: () => {},
            count: () => Promise.resolve(0),
            shutdown: () => {},
            updateState: (slice, state) => {
                _test.updateState[state] = slice;
            }
        };

        _test.executionContext = {
            config: {
                slicers: 2,
                analytics: true,
                max_retries: 4,
                lifecycle,
                probation_window,
                slicer_port: 3000,
                operations: [{ _op: 'testEngine' }],
            },
            slicer: slicer || {
                slicerQueueLength: () => 100000,
                newSlicer: () => Promise.resolve([() => null])
            }
        };

        _test.recovery = {
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
        _test.callSlicer = callSlicer;

        let _testRecovery = false;
        if (testRecovery) _testRecovery = testRecovery;
        _test.engine = engineCode(
            _test.context,
            _test.messaging,
            _test.exStore,
            _test.stateStore
        );

        _test.engineContext = _test.engine.__test_context(
            _test.executionContext,
            _test.executionAnalytics,
            _test.slicerAnalytics,
            _test.recovery,
            1234,
            _testRecovery
        );

        return _test;
    }

    it('can instantiate', (done) => {
        const _test = makeTestContext();
        const { engine } = _test;

        expect(engine).toBeDefined();
        expect(engine.initialize).toBeDefined();

        engine.initialize()
            .then(() => {
                expect(_test.infoMsg).toEqual('execution: 1234 has initialized and is listening on port 3000');
            })
            .then(engine.shutdown())
            .catch(fail)
            .finally(() => { done(); });
    });

    it('registers messaging events', () => {
        const _test = makeTestContext();
        expect(_test.messagingEvents['cluster:execution:pause']).toBeDefined();
        expect(typeof _test.messagingEvents['cluster:execution:pause']).toEqual('function');
        expect(_test.messagingEvents['cluster:execution:resume']).toBeDefined();
        expect(typeof _test.messagingEvents['cluster:execution:resume']).toEqual('function');
        expect(_test.messagingEvents['worker:ready']).toBeDefined();
        expect(typeof _test.messagingEvents['worker:ready']).toEqual('function');
        expect(_test.messagingEvents['worker:slice:complete']).toBeDefined();
        expect(typeof _test.messagingEvents['worker:slice:complete']).toEqual('function');
        expect(_test.messagingEvents['network:disconnect']).toBeDefined();
        expect(typeof _test.messagingEvents['network:disconnect']).toEqual('function');
        expect(_test.messagingEvents['assets:loaded']).toBeDefined();
        expect(typeof _test.messagingEvents['assets:loaded']).toEqual('function');
    });

    it('can set and adjust queue length', () => {
        const _test = makeTestContext();
        const { engineContext } = _test;
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

        expect(engineContext._getQueueLength()).toEqual(undefined);

        engineContext._setQueueLength(errExEnv);

        expect(_test.errMsg).toEqual('slicerQueueLength on the reader must be a function, defaulting to 10000');
        expect(engineContext._getQueueLength()).toEqual(10000);
        // Expect not to change while errExEnv is in use
        engineContext._adjustSlicerQueueLength();
        expect(engineContext._getQueueLength()).toEqual(10000);
        // Expect not to change while errExEnv2 is in use
        engineContext._setQueueLength(errExEnv2);
        expect(engineContext._getQueueLength()).toEqual(10000);

        engineContext._setQueueLength(exEnv);
        expect(engineContext._getQueueLength()).toEqual(10);
        // Expect not to change, dynamicQueueLength should be false
        engineContext._adjustSlicerQueueLength();
        expect(engineContext._getQueueLength()).toEqual(10);

        engineContext._setQueueLength(exEnv2);
        expect(engineContext._getQueueLength()).toEqual(7);
        // Expect to equal executionModules.messaging.getClientCounts => 15
        engineContext._adjustSlicerQueueLength();
        expect(engineContext._getQueueLength()).toEqual(15);

        _test.clientCounter = 22;

        engineContext._adjustSlicerQueueLength();
        expect(engineContext._getQueueLength()).toEqual(22);

        _test.clientCounter = 2;

        engineContext._adjustSlicerQueueLength();
        expect(engineContext._getQueueLength()).toEqual(22);
    });

    it('can enqueue and dequeue workers', () => {
        const _test = makeTestContext();
        const { workerQueue } = _test.engineContext;
        const someWorker = { worker_id: 'someWorker' };

        expect(workerQueue).toBeDefined();
        expect(workerQueue.size()).toEqual(0);

        _test.messagingEvents['worker:ready']({ payload: someWorker });
        expect(workerQueue.size()).toEqual(1);

        _test.messagingEvents['network:disconnect']('ping timeout', someWorker.worker_id);
        expect(workerQueue.size()).toEqual(0);
    });

    it('can enqueue slices', () => {
        const _test = makeTestContext();
        const { slicerQueue } = _test.engineContext;
        const allocateSlice = _test.engineContext._allocateSlice;
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
        const _test = makeTestContext();
        const exId = '1234';
        const { workerQueue, cache } = _test.engineContext;
        const sliceComplete = _test.messagingEvents['worker:slice:complete'];
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

        _test.eventEmitter.on('slice:success', () => {
            gotSliceSuccess = true;
        });

        _test.eventEmitter.on('slice:failure', () => {
            gotSliceFailure = true;
        });

        expect(workerQueue.size()).toEqual(0);

        sliceComplete(slice1, slice1.payload.worker_id);

        expect(gotSliceSuccess).toEqual(true);
        expect(_test.messageResponses[slice1.__msgId]).toEqual({
            incoming: slice1,
            outgoing: {
                payload: {
                    slice_id: slice1.payload.slice.slice_id,
                    recorded: true
                }
            }
        });

        expect(cache.get(`${slice1.payload.slice.slice_id}:complete`)).toEqual(true);

        expect(workerQueue.size()).toEqual(1);

        sliceComplete(slice2, slice2.payload.worker_id);
        expect(gotSliceFailure).toEqual(true);

        expect(workerQueue.size()).toEqual(2);

        sliceComplete(slice3, slice3.payload.worker_id);
        expect(_test.warnMsg).toEqual(`worker: ${slice3.payload.worker_id} has rejoined slicer: ${exId}`);

        expect(workerQueue.size()).toEqual(3);

        sliceComplete(slice4, slice4.payload.worker_id);
        expect(workerQueue.size()).toEqual(3);
    });

    it('can safely call slice complete twice', () => {
        const _test = makeTestContext();
        const { workerQueue, cache } = _test.engineContext;
        const sliceComplete = _test.messagingEvents['worker:slice:complete'];
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

        _test.eventEmitter.on('slice:success', () => {
            gotSliceSuccess = true;
        });

        _test.eventEmitter.on('slice:failure', () => {
            gotSliceFailure = true;
        });

        expect(workerQueue.size()).toEqual(0);

        sliceComplete(slice, slice.payload.worker_id);

        expect(cache.get(`${slice.payload.slice.slice_id}:complete`)).toEqual(true);

        expect(workerQueue.size()).toEqual(1);

        expect(gotSliceSuccess).toEqual(true);

        expect(_test.messageResponses[slice.__msgId]).toEqual({
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

        expect(_test.warnMsg).toEqual(`worker: ${slice.payload.worker_id} already marked slice ${slice.payload.slice.slice_id} as complete`);
    });

    it('can register slicers', () => {
        const _test = makeTestContext();
        const registerSlicers = _test.engineContext._registerSlicers;

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
        expect(_test.eventEmitter.listenerCount('slice:failure')).toEqual(0);


        expect(() => {
            registerSlicers(slicers);
        }).not.toThrowError();

        expect(_test.eventEmitter.listenerCount('slice:failure')).toEqual(1);

        _test.eventEmitter.emit('slice:failure');
        expect(_test.exStatus).toEqual('failing');
    });

    it('execution can recover', (done) => {
        const _test = makeTestContext({ testRecovery: true });
        const executionRecovery = _test.engineContext._executionRecovery;

        function sendEvent(time) {
            return Promise.delay(time)
                .then(() => {
                    _test.eventEmitter.emit('execution:recovery:complete', { starting: 'point' });
                });
        }

        Promise.all([executionRecovery(), sendEvent(150)])
            .spread(data => expect(data).toEqual({ starting: 'point' }))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('terminal error marks job as failed', (done) => {
        const _test = makeTestContext();
        const { executionFailed } = _test.engineContext;
        const myError = new Error('an error');

        Promise.all([executionFailed(myError), Promise.delay(20)])
            .then(() => {
                expect(_test.exStatus).toEqual('failed');
                expect(_test.sentMsg).toEqual({
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
        const _test = makeTestContext({
            lifecycle: 'persistent',
            probation_window: 100
        });
        const sliceComplete = _test.messagingEvents['worker:slice:complete'];
        const workerId = 'some-worker-id';

        const registerSlicers = _test.engineContext._registerSlicers;

        registerSlicers([() => {}], false);

        sliceComplete({
            __msgId: _.uniqueId('msg-id-'),
            payload: {
                worker_id: workerId,
                slice: {
                    slice_id: _.uniqueId('slice-id-'),
                    slice_order: 1,
                }
            }
        }, workerId);

        sliceComplete({
            __msgId: _.uniqueId('msg-id-'),
            payload: {
                worker_id: workerId,
                error: 'Oh no',
            }
        }, workerId);

        Promise.delay(10)
            .then(() => {
                expect(_test.exStatus).toEqual('failing');

                sliceComplete({
                    __msgId: _.uniqueId('msg-id-'),
                    payload: {
                        worker_id: workerId,
                        slice: {
                            slice_id: _.uniqueId('slice-id-'),
                            slice_order: 2,
                        }
                    }
                }, workerId);

                return Promise.delay(150);
            })
            .then(() => {
                expect(_test.exStatus).toEqual('running');
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('slicer init retry will attempt to create slicer', (done) => {
        const _test = makeTestContext();
        let errorCounter = 0;
        function slicerError() {
            if (errorCounter < 2) {
                errorCounter += 1;
                return Promise.reject('an error occurred during slicer initialization');
            }
            return Promise.resolve([() => 'all done']);
        }
        _test.executionContext.slicer.newSlicer = slicerError;

        const slicerInitRetry = _test.engineContext._slicerInitRetry;
        const myError = new Error('an error');

        slicerInitRetry(myError)
            .then((slicerArray) => {
                expect(slicerArray[0]()).toEqual('all done');
            })
            .catch(fail)
            .finally(() => {
                done();
            });
    });

    it('can pass along assets:loaded event', () => {
        const _test = makeTestContext();
        const assetsLoaded = _test.messagingEvents['assets:loaded'];
        let assetsHaveLoaded = false;
        const data = { asset: 'data' };

        _test.eventEmitter.on('execution:assets_loaded', (results) => {
            assetsHaveLoaded = results;
        });

        assetsLoaded(data);

        expect(assetsHaveLoaded).toEqual(data);
    });

    it('watchdogs can call', (done) => {
        const _test = makeTestContext();
        _test.clientCounter = 0;
        const exId = 1234;
        const startWorkerConnectionWatchDog = _test.engineContext._startWorkerConnectionWatchDog;
        const startWorkerDisconnectWatchDog = _test.engineContext._startWorkerDisconnectWatchDog;

        Promise.all([startWorkerConnectionWatchDog(), Promise.delay(750)])
            .spread(() => {
                expect(_test.exStatus).toEqual('failed');
                expect(_test.sentMsg).toEqual({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: 1234,
                    payload: { set_status: true }
                });
                expect(_test.errMsg).toEqual(`A worker has not connected to a slicer for ex: ${exId}, shutting down execution`);
                return Promise.all([
                    startWorkerDisconnectWatchDog(),
                    Promise.delay(750),
                    _test.messagingEvents['worker:ready']({
                        payload: {
                            worker_id: 1,
                        }
                    })
                ]);
            })
            .then(() => {
                expect(_test.exStatus).toEqual('failed');
                expect(_test.sentMsg).toEqual({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: 1234,
                    payload: { set_status: true }
                });
                expect(_test.errMsg).toEqual(`all workers from slicer #${exId} have disconnected`);
            })
            .catch(fail)
            .finally(() => {
                done();
            });
    });

    it('can update operations', () => {
        const _test = makeTestContext();
        const updateData = [{ _op: 1 }];

        _test.eventEmitter.emit('slicer:execution:update', { update: updateData });
        expect(_test.executionOperationsUpdate).toEqual({ operations: updateData });
    });

    it('can create a scheduler', (done) => {
        const _test = makeTestContext();
        // prevent slicer all done event collisions
        const getScheduler = _test.engineContext._getScheduler;
        const { slicerQueue } = _test.engineContext;
        const allDone = () => null;
        const makesSlices = () => ({ some: 'data' });
        const makesArrayOfSlices = () => [{ id: 1 }, { id: 2 }];
        const slicerError = () => {
            throw new Error('im an error');
        };
        let isASlicerDone = false;

        _test.eventEmitter.on('slicer:finished', () => {
            isASlicerDone = true;
        });

        const slicers = getScheduler([makesSlices, makesArrayOfSlices, allDone, slicerError]);

        expect(slicers.length).toEqual(4);
        expect(slicerQueue.size()).toEqual(0);

        _test.callSlicer(slicers[0])
            .then(() => {
                expect(slicerQueue.size()).toEqual(1);
                const slice = slicerQueue.dequeue();
                expect(slice.request).toEqual({ some: 'data' });
                return _test.callSlicer(slicers[1]);
            })
            .then(() => {
                expect(slicerQueue.size()).toEqual(2);
                const slice1 = slicerQueue.dequeue();
                expect(slice1.request).toEqual({ id: 1 });
                const slice2 = slicerQueue.dequeue();
                expect(slice2.request).toEqual({ id: 2 });
                return _test.callSlicer(slicers[2]);
            })
            .then(() => {
                expect(slicerQueue.size()).toEqual(0);
                expect(isASlicerDone).toEqual(true);
                return _test.callSlicer(slicers[3]);
            })
            .then(() => {
                expect(_test.sentMsg.to).toEqual('cluster_master');
                expect(_test.sentMsg.message).toEqual('execution:error:terminal');
                return true;
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can initialize, pause, resume and shutdown', (done) => {
        const spyObj = {
            firstSlicer: jest.fn().mockResolvedValue({ some: 'data' }),
            secondSlicer: jest.fn().mockResolvedValue({ some: 'data' })
        };

        const _test = makeTestContext({
            slicer: {
                newSlicer: () => [spyObj.firstSlicer, spyObj.secondSlicer],
                slicerQueueLength: () => 100
            }
        });

        const { engine } = _test;
        const { slicerQueue } = _test.engineContext;

        let currentSlicerCount;
        let prevSlicerCount;
        let currFirstCallCount;
        let prevFirstCallCount = 0;
        let currSecondCallCount;
        let prevSecondCallCount = 0;

        currFirstCallCount = spyObj.firstSlicer.mock.calls.length;
        currSecondCallCount = spyObj.secondSlicer.mock.calls.length;
        expect(spyObj.firstSlicer).not.toHaveBeenCalled();
        expect(spyObj.secondSlicer).not.toHaveBeenCalled();

        currentSlicerCount = slicerQueue.size();
        prevSlicerCount = currentSlicerCount;

        expect(currentSlicerCount).toEqual(0);

        const pause = _test.messagingEvents['cluster:execution:pause'];
        const resume = _test.messagingEvents['cluster:execution:resume'];
        const { shutdown } = engine;
        // for pausing/stopping, the async slicers may be already calling so counts may
        // increase by 1 or 2 since there are two slicers
        function compareCounts(prev, next) {
            if (prev === next || prev + 2 === next || prev + 1 === next) return true;
            return false;
        }

        engine.initialize()
            .then(() => {
                expect(_test.debugMsg).toEqual('starting the slicer engine');
                return Promise.delay(10);
            })
            .then(() => {
                resume();
                expect(_test.errMsg).toEqual('cannot call resume on a running execution');
                return Promise.delay(10);
            })
            .then(() => {
                currentSlicerCount = slicerQueue.size();
                expect(currentSlicerCount).toBeGreaterThan(prevSlicerCount);
                prevSlicerCount = currentSlicerCount;

                currFirstCallCount = spyObj.firstSlicer.mock.calls.length;
                currSecondCallCount = spyObj.secondSlicer.mock.calls.length;

                expect(currFirstCallCount).toBeGreaterThan(prevFirstCallCount);
                expect(currSecondCallCount).toBeGreaterThan(prevSecondCallCount);

                prevFirstCallCount = currFirstCallCount;
                prevSecondCallCount = currSecondCallCount;
                return pause();
            })
            .then(() => {
                currentSlicerCount = slicerQueue.size();
                expect(compareCounts(prevSlicerCount, currentSlicerCount)).toEqual(true);

                currFirstCallCount = spyObj.firstSlicer.mock.calls.length;
                currSecondCallCount = spyObj.secondSlicer.mock.calls.length;

                expect(compareCounts(prevFirstCallCount, currFirstCallCount)).toEqual(true);
                expect(compareCounts(prevSecondCallCount, currSecondCallCount)).toEqual(true);

                resume();
                return Promise.delay(20);
            })
            .then(() => {
                currentSlicerCount = slicerQueue.size();
                expect(currentSlicerCount).toBeGreaterThan(prevSlicerCount);
                prevSlicerCount = currentSlicerCount;

                currFirstCallCount = spyObj.firstSlicer.mock.calls.length;
                currSecondCallCount = spyObj.secondSlicer.mock.calls.length;

                expect(currFirstCallCount).toBeGreaterThan(prevFirstCallCount);
                expect(currSecondCallCount).toBeGreaterThan(prevSecondCallCount);

                prevFirstCallCount = currFirstCallCount;
                prevSecondCallCount = currSecondCallCount;

                return shutdown();
            })
            .then(() => {
                currentSlicerCount = slicerQueue.size();
                expect(compareCounts(prevSlicerCount, currentSlicerCount)).toEqual(true);

                currFirstCallCount = spyObj.firstSlicer.mock.calls.length;
                currSecondCallCount = spyObj.secondSlicer.mock.calls.length;

                expect(compareCounts(prevFirstCallCount, currFirstCallCount)).toEqual(true);
                expect(compareCounts(prevSecondCallCount, currSecondCallCount)).toEqual(true);
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can complete when slicers are finished', (done) => {
        const _test = makeTestContext();
        // prevent slicer all done event collisions
        const { slicerQueue } = _test.engineContext;

        let allDoneCounter = 0;
        const allDone = () => null;

        _test.eventEmitter.on('slicer:finished', () => {
            allDoneCounter += 1;
        });

        _test.engineContext._registerSlicers([allDone, allDone]);
        _test.engineContext._engineSetup();

        Promise.delay(20)
            .then(() => {
                expect(allDoneCounter).toEqual(2);
                // remove all slices to act like everything is done
                while (slicerQueue.size()) {
                    slicerQueue.dequeue();
                }
                // act like all workers have shutdown
                _test.clientCounter = 0;
                return Promise.delay(150);
            })
            .then(() => {
                expect(_test.sentMsg.to).toEqual('cluster_master');
                expect(_test.sentMsg.message).toEqual('execution:finished');
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('executionShutdown', (done) => {
        const _test = makeTestContext();
        const executionShutdown = _test.engine.shutdown;
        const exId = 1234;
        let gotStopEvent = false;

        _test.eventEmitter.on('execution:stop', () => { gotStopEvent = true; });

        Promise.all([executionShutdown(), Promise.delay(50)])
            .then(() => {
                expect(_test.infoMsg).toEqual(`slicer for execution: ${exId} has received a shutdown notice`);
                expect(gotStopEvent).toEqual(true);
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can log error counts at end of execution', (done) => {
        const _test = makeTestContext();
        const executionCompleted = _test.engineContext._executionCompleted;
        const exId = 1234;
        _test.stateStore.count = () => Promise.resolve(2);

        Promise.all([executionCompleted(), Promise.delay(50)])
            .then(() => {
                expect(_test.errMsg).toEqual(`execution: ${exId} had 2 slice failures during processing`);
                expect(_test.exStatus).toEqual('failed');
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can send slices to specific workers', (done) => {
        const _test = makeTestContext();
        const { slicerQueue, workerQueue, _enqueueWorker } = _test.engineContext;
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

        _test.engineContext._engineSetup();

        _test.eventEmitter.on('slice:invalid', (data) => { invalidSlice = data; });

        _enqueueWorker(worker1);
        _enqueueWorker(worker2);
        _enqueueWorker(worker3);

        Promise.delay(10)
            .then(() => {
                // We expect that no workers have been allocated yet
                expect(workerQueue.size()).toEqual(3);
                slicerQueue.enqueue(slice1);
                return Promise.delay(10);
            })
            .then(() => {
                expect(workerQueue.size()).toEqual(2);
                expect(_test.sentMsg).toEqual({
                    to: 'worker',
                    message: 'slicer:slice:new',
                    payload: slice1,
                    address: 1,
                    response: true
                });
                expect(workerQueueList()).toEqual([worker2, worker3]);
                slicerQueue.enqueue(slice2);
                return Promise.delay(10);
            })
            .then(() => {
                expect(workerQueue.size()).toEqual(1);
                expect(_test.sentMsg).toEqual({
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
                expect(_test.updateState).toEqual({});
                return Promise.delay(10);
            })
            .then(() => {
                expect(workerQueue.size()).toEqual(1);
                expect(invalidSlice).toEqual(slice3.request);
                expect(_test.updateState).toEqual({ invalid: slice3.request });
                expect(workerQueueList()).toEqual([worker2]);
            })
            .catch(fail)
            .finally(() => { done(); });
    });

    it('should not send two slices to the same worker', (done) => {
        const _test = makeTestContext();
        const { workerQueue, slicerQueue, _enqueueWorker } = _test.engineContext;

        let invalidSlice = null;

        _test.engineContext._engineSetup();

        _test.eventEmitter.on('slice:invalid', (data) => { invalidSlice = data; });

        _enqueueWorker({ worker_id: 1 });
        _enqueueWorker({ worker_id: 1 });
        _enqueueWorker({ worker_id: 2 });

        expect(workerQueue.size()).toEqual(2);
        expect(_test.sentMsgs).toEqual([]);

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
        Promise.delay(10).then(() => {
            expect(workerQueue.size()).toEqual(0);
            expect(_test.sentMsgs.length).toEqual(2);
            expect(_test.sentMsgs).toEqual([
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
        const _test = makeTestContext();
        const { workerQueue, slicerQueue, _enqueueWorker } = _test.engineContext;

        let invalidSlice = null;

        function workerQueueList() {
            const results = [];
            workerQueue.each(worker => results.push(worker));
            return results;
        }

        _test.engineContext._engineSetup();

        _test.eventEmitter.on('slice:invalid', (data) => { invalidSlice = data; });

        _enqueueWorker({ worker_id: 1 });
        _enqueueWorker({ worker_id: 1 });
        _enqueueWorker({ worker_id: 2 });

        expect(workerQueue.size()).toEqual(2);
        expect(_test.sentMsgs).toEqual([]);

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
        Promise.delay(10).then(() => {
            expect(workerQueue.size()).toEqual(1);
            expect(_test.sentMsgs.length).toEqual(1);
            expect(_test.sentMsgs).toEqual([
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
        const _test = makeTestContext();
        const { workerQueue, _enqueueWorker } = _test.engineContext;

        _test.engineContext._engineSetup();

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
        const _test = makeTestContext();
        const { slicerQueue, _sendSlice } = _test.engineContext;
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
        _test.respondingMessage = { payload: { willProcess: false, slice: returningResponse } };
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
