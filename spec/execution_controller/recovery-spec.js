'use strict';

const recoveryCode = require('../../lib/cluster/execution_controller/recovery');
const eventsModule = require('events');
const Promise = require('bluebird');

const eventEmitter = new eventsModule.EventEmitter();
const eventEmitter2 = new eventsModule.EventEmitter();

describe('execution recovery', () => {
    const logger = {
        error() {},
        info() {},
        warn() {},
        trace() {},
        debug() {}
    };

    const startingPoints = {};

    let sentMsg = null;
    let testSlices = [{ slice_id: 1 }, { slice_id: 2 }];

    beforeEach(() => {
        testSlices = [{ slice_id: 1 }, { slice_id: 2 }];
    });

    const context = {
        apis: {
            foundation: {
                makeLogger: () => logger,
                getSystemEvents: () => eventEmitter
            }
        }
    };
    const messaging = {
        send: (msg) => { sentMsg = msg; }
    };
    const executionAnalytics = { getAnalytics: () => ({}) };
    const exStore = {
        executionMetaData: () => {},
        setStatus: () => new Promise(resolve => resolve(true))
    };
    const stateStore = {
        executionStartingSlice: (exId, ind) => startingPoints[ind] = exId,
        recoverSlices: () => {
            const data = testSlices.slice();
            testSlices = [];
            return Promise.resolve(data);
        }
    };
    const executionContext = { config: { slicers: 2 } };

    const testConfig = { ex_id: '1234', job_id: '5678', recover_execution: '9999' };
    let recoveryModule = recoveryCode(context, messaging, executionAnalytics, exStore, stateStore, executionContext);
    let recovery = recoveryModule.__test_context(testConfig);

    function waitFor(fn, time) {
        return new Promise((resolve) => {
            setTimeout(() => {
                fn();
                resolve(true);
            }, time);
        });
    }

    function sendEvent(event, data, emitter) {
        const events = emitter || eventEmitter;
        return () => {
            events.emit(event, data);
        };
    }

    it('has the proper methods', () => {
        expect(recoveryModule.initialize).toBeDefined();
        expect(typeof recoveryModule.initialize).toEqual('function');
        expect(recoveryModule.recoverSlices).toBeDefined();
        expect(typeof recoveryModule.recoverSlices).toEqual('function');
        expect(recoveryModule.__test_context).toBeDefined();
        expect(typeof recoveryModule.__test_context).toEqual('function');
        expect(recoveryModule.newSlicer).toBeDefined();
        expect(typeof recoveryModule.newSlicer).toEqual('function');
        expect(recoveryModule.getSlicerStartingPosition).toBeDefined();
        expect(typeof recoveryModule.getSlicerStartingPosition).toEqual('function');
        expect(recoveryModule.recoveryComplete).toBeDefined();
        expect(typeof recoveryModule.recoveryComplete).toEqual('function');
    });

    it('manages retry slice state', () => {
        expect(recovery._retryState()).toEqual({});

        recovery._setId({ slice_id: 1 });

        expect(recovery._retryState()).toEqual({ 1: true });
        expect(recovery._recoveryBatchCompleted()).toEqual(false);

        recovery._sliceComplete({ slice: { slice_id: 1 } });

        expect(recovery._retryState()).toEqual({ });
        expect(recovery._recoveryBatchCompleted()).toEqual(true);
    });

    it('initalizes and sets up listeners', (done) => {
        recoveryModule = recoveryCode(context, messaging, executionAnalytics, exStore, stateStore, executionContext);
        recovery = recoveryModule.__test_context(testConfig);
        recoveryModule.initialize();

        expect(recovery._retryState()).toEqual({ });
        expect(recovery._recoveryBatchCompleted()).toEqual(true);

        recovery._setId({ slice_id: 1 });

        const sendSucess = sendEvent('slice:success', { slice: { slice_id: 1 } });
        const sendSucess2 = sendEvent('slice:success', { slice: { slice_id: 2 } });
        const sendError = sendEvent('slice:failure', 'an error occured');

        Promise.all([
            recovery._waitForRecoveryBatchCompletion(),
            waitFor(sendSucess, 100),
            waitFor(sendSucess2, 250)
        ])
            .then(() => {
                expect(recovery._retryState()).toEqual({});
                expect(recovery._recoveryBatchCompleted()).toEqual(true);
                return recovery._setId({ slice_id: 2 });
            })
            .then(() => Promise.all([sendError(), waitFor(() => {}, 30)]))
            .then(() => {
                expect(sentMsg).toEqual({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: '1234',
                    payload: { set_status: true }
                });
            })
            .catch(fail)
            .finally(() => done());
    });

    it('can recover slices', (done) => {
        context.apis.foundation.getSystemEvents = () => eventEmitter2;
        recoveryModule = recoveryCode(context, messaging, executionAnalytics, exStore, stateStore, executionContext);
        recovery = recoveryModule.__test_context(testConfig);

        expect(recoveryModule.recoveryComplete()).toEqual(true);

        recoveryModule.initialize();

        const data1 = { slice_id: 1 };
        const data2 = { slice_id: 2 };
        const sendSucess1 = sendEvent('slice:success', { slice: data1 }, eventEmitter2);
        const sendSucess2 = sendEvent('slice:success', { slice: data2 }, eventEmitter2);
        let allDoneEventFired = false;

        eventEmitter2.on('execution:recovery:complete', () => allDoneEventFired = true);

        expect(recoveryModule.recoveryComplete()).toEqual(false);
        let slicer;

        Promise.all([recoveryModule.newSlicer(), waitFor(sendSucess1, 100)])
            .spread((slicerArray) => {
                expect(Array.isArray(slicerArray)).toEqual(true);
                expect(slicerArray.length).toEqual(1);
                expect(typeof slicerArray[0]).toEqual('function');
                slicer = slicerArray[0];
                expect(recoveryModule.recoveryComplete()).toEqual(false);
                return slicer();
            })
            .then((slice) => {
                expect(slice).toEqual({ slice_id: 1 });
                expect(recoveryModule.recoveryComplete()).toEqual(false);
                return waitFor(sendSucess2, 124);
            })
            .then(() => slicer())
            .then((slice) => {
                expect(slice).toEqual({ slice_id: 2 });
                expect(recoveryModule.recoveryComplete()).toEqual(false);
                return Promise.all([slicer(), waitFor(() => {}, 150)]);
            })
            .spread((slice) => {
                expect(slice).toEqual(null);
                expect(allDoneEventFired).toEqual(true);
                expect(recoveryModule.recoveryComplete()).toEqual(true);
                return recoveryModule.getSlicerStartingPosition();
            })
            .then(() => {
                expect(startingPoints).toEqual({ 0: '9999', 1: '9999' });
            })
            .catch(fail)
            .finally(done);
    });
});
