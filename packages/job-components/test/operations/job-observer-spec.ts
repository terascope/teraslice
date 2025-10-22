import 'jest-extended';
import { times } from '@terascope/core-utils';
import {
    TestContext, newTestExecutionConfig, Context,
    JobObserver, SliceAnalyticsData
} from '../../src/index.js';

describe('JobObserver', () => {
    let observer: JobObserver;

    const context = new TestContext('teraslice-operations') as Context;
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

    describe('when analytics is set to true', () => {
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

            const analytics = observer.analyticsData as SliceAnalyticsData;

            expect(analytics.time).toBeArrayOfSize(opLength);
            expect(analytics.size).toBeArrayOfSize(opLength);
            expect(analytics.memory).toBeArrayOfSize(opLength);

            for (let index = 0; index < opLength; index++) {
                expect(analytics.size[index]).toEqual(index * 10);
                expect(analytics.memory[index]).toBeNumber();
                expect(analytics.time[index]).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('when analytics is set to false', () => {
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
