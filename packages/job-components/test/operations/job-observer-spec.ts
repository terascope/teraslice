import 'jest-extended'; // require for type definitions
import { times } from '@terascope/utils';
import { TestContext, newTestExecutionConfig, WorkerContext, JobObserver, SliceAnalyticsData } from '../../src';

describe('JobObserver', () => {
    let observer: JobObserver;

    const context = new TestContext('teraslice-operations') as WorkerContext;
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

            observer = new JobObserver(context, { _name: 'example' }, exConfig);
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
                observer.onOperationStart(sliceId, index);
                observer.onOperationComplete(sliceId, index, index * 10);
            }

            const analyitcs = observer.analyticsData as SliceAnalyticsData;

            expect(analyitcs.time).toBeArrayOfSize(opLength);
            expect(analyitcs.size).toBeArrayOfSize(opLength);
            expect(analyitcs.memory).toBeArrayOfSize(opLength);

            for (let index = 0; index < opLength; index++) {
                expect(analyitcs.size[index]).toEqual(index * 10);
                expect(analyitcs.memory[index]).toBeNumber();
                expect(analyitcs.time[index]).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('when analyitcs is set to false', () => {
        beforeAll(() => {
            exConfig.analytics = false;

            observer = new JobObserver(context, { _name: 'job-observer' }, exConfig);
            return observer.initialize();
        });

        afterAll(() => observer.shutdown());

        it('should have the default analyticsData', () => {
            expect(observer.collectAnalytics).toBeFalse();
            expect(observer.analyticsData).toBeUndefined();
        });

        it('should not gather the analytics when processing a slice', async () => {
            const sliceId = 'hello';

            await observer.onSliceInitialized(sliceId);

            for (let index = 0; index < opLength; index++) {
                observer.onOperationStart(sliceId, index);
                observer.onOperationComplete(sliceId, index, index * 10);
            }

            expect(observer.analyticsData).toBeUndefined();
        });
    });
});
