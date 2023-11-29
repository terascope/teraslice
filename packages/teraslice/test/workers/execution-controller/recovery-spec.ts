import { pDelay, pWhile } from '@terascope/utils';
import { debugLogger } from '@terascope/job-components';
import { EventEmitter } from 'node:events';
import { RecoveryModule } from '../../../src/lib/workers/execution-controller/recovery';

const eventEmitter = new EventEmitter();
const eventEmitter2 = new EventEmitter();

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
    } as any;

    const stateStore = {
        recoverSlices: () => {
            const data = testSlices.slice();
            testSlices = [];
            return Promise.resolve(data);
        }
    } as any;

    const executionContext = {
        config: {
            slicers: 2,
            recovered_execution: '9999'
        },
        ex_id: '1234',
        job_id: '5678'
    } as any;

    function waitFor(fn: () => void, time: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                fn();
                resolve(true);
            }, time);
        });
    }

    function sendEvent(event: string, data: any, emitter?: EventEmitter) {
        const events = emitter || eventEmitter;
        return () => {
            events.emit(event, data);
        };
    }

    it('has the proper methods', () => {
        const recoveryModule = new RecoveryModule(context, executionContext);

        expect(recoveryModule.initialize).toBeFunction();
        expect(recoveryModule.handle).toBeFunction();
        expect(recoveryModule.getSlice).toBeFunction();
        expect(recoveryModule.getSlices).toBeFunction();
        expect(recoveryModule.recoveryComplete).toBeFunction();
        expect(recoveryModule.shutdown).toBeFunction();
    });

    it('manages retry slice state', () => {
        const recoveryModule = new RecoveryModule(context, executionContext);
        // @ts-expect-error
        expect(recoveryModule._retryState()).toEqual({});
        // @ts-expect-error
        recoveryModule._setId({ slice_id: 1 });
        // @ts-expect-error
        expect(recoveryModule._retryState()).toEqual({ 1: true });
        // @ts-expect-error
        expect(recoveryModule._recoveryBatchCompleted()).toEqual(false);
        // @ts-expect-error
        recoveryModule._sliceComplete({ slice: { slice_id: 1 } });
        // @ts-expect-error
        expect(recoveryModule._retryState()).toEqual({ 1: false });
        // @ts-expect-error
        expect(recoveryModule._recoveryBatchCompleted()).toEqual(true);
    });

    it('initializes and sets up listeners', async () => {
        const recoveryModule = new RecoveryModule(context, executionContext);

        await recoveryModule.initialize(stateStore);
        // @ts-expect-error
        expect(recoveryModule._retryState()).toEqual({});
        // @ts-expect-error
        expect(recoveryModule._recoveryBatchCompleted()).toEqual(true);
        // @ts-expect-error
        recoveryModule._setId({ slice_id: 1 });
        // @ts-expect-error
        recoveryModule._setId({ slice_id: 2 });

        const sendSucess = sendEvent('slice:success', { slice: { slice_id: 1 } });
        const sendSucess2 = sendEvent('slice:success', { slice: { slice_id: 2 } });

        return Promise.all([
            // @ts-expect-error
            recoveryModule._waitForRecoveryBatchCompletion(),
            waitFor(sendSucess, 100),
            waitFor(sendSucess2, 250)
        ]).then(() => {
            // @ts-expect-error
            expect(recovery._retryState()).toEqual({
                1: false,
                2: false
            });
            // @ts-expect-error
            expect(recovery._recoveryBatchCompleted()).toEqual(true);
            // @ts-expect-error
            return recovery._setId({ slice_id: 2 });
        });
    });

    it('can recover slices', async () => {
        context.apis.foundation.getSystemEvents = () => eventEmitter2;
        const recoveryModule = new RecoveryModule(context, executionContext);

        expect(recoveryModule.recoveryComplete()).toEqual(true);

        await recoveryModule.initialize(stateStore);

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
