'use strict';

const recoveryCode = require('../../lib/cluster/execution_controller/recovery');
const events = require('events');
const Promise = require('bluebird');

const eventEmitter = new events.EventEmitter();

describe('execution recovery', () => {
    const logger = {
        error() {},
        info() {},
        warn() {},
        trace() {},
        debug() {}
    };
    let sentMsg = null;
    const startingPoints = {};
    let testSlices = [{ slice_id: 1 }, { slice_id: 2 }];
    const queue = [];

    const context = { apis: { foundation: { makeLogger: () => logger,
        getSystemEvents: () => eventEmitter } } };
    const messaging = { send: (msg) => { sentMsg = msg; } };
    const executionAnalytics = { getAnalytics: () => ({}) };
    const exStore = {
        failureMetaData: () => {},
        setStatus: () => {}
    };
    const stateStore = {
        executionStartingSlice: (exId, ind) => { startingPoints[ind] = exId; },
        recoverSlices: () => {
            const data = testSlices.slice();
            testSlices = [];
            return Promise.resolve(data);
        }
    };
    const enqueueSlice = (val) => { queue.push(val); };
    const executionContext = { config: { slicers: 2 } };

    const testConfig = { ex_id: '1234', job_id: '5678', recover_execution: '9999' };
    const recoveryModule = recoveryCode(context, messaging, executionAnalytics, exStore, stateStore, executionContext, enqueueSlice);
    const recovery = recoveryModule.__test_context(testConfig);

    function waitFor(fn, time) {
        return new Promise((resolve) => {
            setTimeout(() => {
                fn();
                resolve(true);
            }, time);
        });
    }

    function sendEvent(event, data) {
        return () => {
            eventEmitter.emit(event, data);
        };
    }

    it('has the proper methods', () => {
        expect(recoveryModule.initialize).toBeDefined();
        expect(typeof recoveryModule.initialize).toEqual('function');
        expect(recoveryModule.recoverSlices).toBeDefined();
        expect(typeof recoveryModule.recoverSlices).toEqual('function');
        expect(recoveryModule.__test_context).toBeDefined();
        expect(typeof recoveryModule.__test_context).toEqual('function');
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
        recoveryModule.initialize();

        expect(recovery._retryState()).toEqual({ });
        expect(recovery._recoveryBatchCompleted()).toEqual(true);

        recovery._setId({ slice_id: 1 });

        const sendSucess = sendEvent('slice:success', { slice: { slice_id: 1 } });
        const sendError = sendEvent('slice:failure');

        Promise.all([recovery._waitForRecoveryBatchCompletion(), waitFor(sendSucess, 100)])
            .then(() => {
                expect(recovery._retryState()).toEqual({});
                expect(recovery._recoveryBatchCompleted()).toEqual(true);
                return recovery._setId({ slice_id: 2 });
            })
            .then(() => {
                sendError();
                expect(sentMsg).toEqual({
                    to: 'cluster_master',
                    message: 'execution:recovery:failed',
                    ex_id: '1234'
                });
            })
            .catch(fail)
            .finally(() => done());
    });

    it('can recover slices', (done) => {
        const data1 = { slice_id: 1 };
        const data2 = { slice_id: 2 };
        const sendSucess1 = sendEvent('slice:success', { slice: data1 });
        const sendSucess2 = sendEvent('slice:success', { slice: data2 });
        function sequence() {
            return new Promise((resolve) => {
                waitFor(sendSucess1, 100)
                    .then(() => waitFor(sendSucess2, 100))
                    .then(() => resolve());
            });
        }

        Promise.all([recoveryModule.recoverSlices(), sequence()])
            .then(() => expect(startingPoints).toEqual({ 0: '9999', 1: '9999' }))
            .then(() => {
                expect(queue.length).toEqual(2);
                expect(queue[0]).toEqual(data1);
                expect(queue[1]).toEqual(data2);
            })
            .catch(fail)
            .finally(done);
    });
});
