import 'jest-extended'; // require for type definitions
import { times } from '../../src/utils';
import { TestContext, newTestExecutionConfig, WorkerContext, JobObserver } from '../../src';

describe('JobObserver', () => {
    let observer: JobObserver;

    const context = new TestContext('teraslice-operations');
    const exConfig = newTestExecutionConfig();
    exConfig.operations = [
        {
            _op: 'fetcher'
        },
        {
            _op: 'processor'
        }
    ];
    const opLength = exConfig.operations.length;

    const defaultAnalytics = {
        time: times(opLength, () => -1),
        memory: times(opLength, () => -1),
        size: times(opLength, () => -1),
    };

    describe('when analyitcs is set to true', () => {
        beforeAll(() => {
            exConfig.analytics = true;

            observer = new JobObserver(context as WorkerContext, exConfig);
            return observer.initialize();
        });

        afterAll(() => observer.shutdown());

        it('should have the default analyticsData', () => {
            expect(observer.collectAnalytics).toBeTrue();
            expect(observer.analyticsData).toEqual(defaultAnalytics);
        });

        it('should gather the analytics when processing a slice', async () => {
            const sliceId = 'hello';

            await observer.onSliceInitialized(sliceId);

            for (let index = 0; index < opLength; index++) {
                observer.onOperationComplete(index, sliceId, index * 10);
            }

            expect(observer.analyticsData.time).toBeArrayOfSize(opLength);
            expect(observer.analyticsData.size).toBeArrayOfSize(opLength);
            expect(observer.analyticsData.memory).toBeArrayOfSize(opLength);

            for (let index = 0; index < opLength; index++) {
                expect(observer.analyticsData.size[index]).toEqual(index * 10);
                expect(observer.analyticsData.memory[index]).toBeNumber();
                expect(observer.analyticsData.time[index]).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('when analyitcs is set to false', () => {
        beforeAll(() => {
            exConfig.analytics = false;

            observer = new JobObserver(context as WorkerContext, exConfig);
            return observer.initialize();
        });

        afterAll(() => observer.shutdown());

        it('should have the default analyticsData', () => {
            expect(observer.collectAnalytics).toBeFalse();
            expect(observer.analyticsData).toEqual(defaultAnalytics);
        });

        it('should not gather the analytics when processing a slice', async () => {
            const sliceId = 'hello';

            await observer.onSliceInitialized(sliceId);

            for (let index = 0; index < opLength; index++) {
                observer.onOperationComplete(index, sliceId, index * 10);
            }

            expect(observer.analyticsData).toEqual(defaultAnalytics);
        });
    });
});
