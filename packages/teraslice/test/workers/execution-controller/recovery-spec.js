import eventsModule from 'events';
import { pDelay, pWhile } from '@terascope/utils';
import { debugLogger } from '@terascope/job-components';
import recoveryCode from '../../../lib/workers/execution-controller/recovery';

const eventEmitter = new eventsModule.EventEmitter();
const eventEmitter2 = new eventsModule.EventEmitter();

describe('execution recovery', () => {
    const logger = debugLogger('execution-recovery');

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

    const stateStore = {
        recoverSlices: () => {
            const data = testSlices.slice();
            testSlices = [];
            return Promise.resolve(data);
        }
    };
    const executionContext = {
        config: {
            slicers: 2,
            recovered_execution: '9999'
        },
        ex_id: '1234',
        job_id: '5678'
    };

    let recoveryModule = recoveryCode(context, stateStore, executionContext);

    let recovery = recoveryModule.__test_context();

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
        expect(recoveryModule.initialize).toBeFunction();
        expect(recoveryModule.__test_context).toBeFunction();
        expect(recoveryModule.handle).toBeFunction();
        expect(recoveryModule.getSlice).toBeFunction();
        expect(recoveryModule.getSlices).toBeFunction();
        expect(recoveryModule.recoveryComplete).toBeFunction();
        expect(recoveryModule.shutdown).toBeFunction();
    });

    it('manages retry slice state', () => {
        expect(recovery._retryState()).toEqual({});

        recovery._setId({ slice_id: 1 });

        expect(recovery._retryState()).toEqual({ 1: true });
        expect(recovery._recoveryBatchCompleted()).toEqual(false);

        recovery._sliceComplete({ slice: { slice_id: 1 } });

        expect(recovery._retryState()).toEqual({ 1: false });
        expect(recovery._recoveryBatchCompleted()).toEqual(true);
    });

    it('initializes and sets up listeners', () => {
        recoveryModule = recoveryCode(context, stateStore, executionContext);

        recovery = recoveryModule.__test_context();
        recoveryModule.initialize();

        expect(recovery._retryState()).toEqual({});
        expect(recovery._recoveryBatchCompleted()).toEqual(true);

        recovery._setId({ slice_id: 1 });
        recovery._setId({ slice_id: 2 });

        const sendSucess = sendEvent('slice:success', { slice: { slice_id: 1 } });
        const sendSucess2 = sendEvent('slice:success', { slice: { slice_id: 2 } });

        return Promise.all([
            recovery._waitForRecoveryBatchCompletion(),
            waitFor(sendSucess, 100),
            waitFor(sendSucess2, 250)
        ]).then(() => {
            expect(recovery._retryState()).toEqual({
                1: false,
                2: false
            });
            expect(recovery._recoveryBatchCompleted()).toEqual(true);
            return recovery._setId({ slice_id: 2 });
        });
    });

    it('can recover slices', () => {
        context.apis.foundation.getSystemEvents = () => eventEmitter2;
        recoveryModule = recoveryCode(context, stateStore, executionContext);

        recovery = recoveryModule.__test_context();

        expect(recoveryModule.recoveryComplete()).toEqual(true);

        recoveryModule.initialize();

        const data1 = { slice_id: 1 };
        const data2 = { slice_id: 2 };
        const sendSucess1 = sendEvent('slice:success', { slice: data1 }, eventEmitter2);
        const sendSucess2 = sendEvent('slice:success', { slice: data2 }, eventEmitter2);
        let allDoneEventFired = false;

        eventEmitter2.on('execution:recovery:complete', () => {
            allDoneEventFired = true;
        });

        expect(recoveryModule.recoveryComplete()).toEqual(false);

        const createSlicesPromise = pWhile(
            () => recoveryModule.handle(),
            { timeoutMs: 5000 }
        );

        const slicer = async () => {
            await pWhile(async () => {
                if (recoveryModule.sliceCount() || recoveryModule.recoveryComplete()) return true;
                await pDelay(10);
                return false;
            }, { timeoutMs: 5000 });
            return recoveryModule.getSlice();
        };

        return Promise.all([waitFor(sendSucess1, 100)])
            .then(() => {
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
            .then(([slice]) => {
                expect(slice).toEqual(null);
                expect(allDoneEventFired).toEqual(true);
                expect(recoveryModule.recoveryComplete()).toEqual(true);
                return createSlicesPromise;
            });
    });
});
