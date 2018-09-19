import _ from 'lodash';
import { newTestJobConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { ParallelSlicer, SlicerFn } from '../../src';

describe('ParallelSlicer', () => {
    class ExampleParallelSlicer extends ParallelSlicer {
        public async newSlicer(): Promise<SlicerFn> {
            return async () => {
                return { hi: true };
            };
        }
    }

    let slicer: ExampleParallelSlicer;

    beforeAll(async () => {
        const context = new TestContext('teraslice-operations');
        const jobConfig = newTestJobConfig();

        jobConfig.operations.push({
            _op: 'example-op',
        });

        jobConfig.slicers = 3;

        const opConfig = jobConfig.operations[0];
        const logger = context.apis.foundation.makeLogger('job-logger');
        slicer = new ExampleParallelSlicer(context, jobConfig, opConfig, logger);
        await slicer.initialize([]);
    });

    describe('->handle', () => {
        it('should resolve with 1 slice', async () => {
            const done = await slicer.handle();
            expect(done).toBeFalse();

            expect(slicer.dequeue()).toMatchObject({
                needsState: true,
                slice: {
                    slicer_order: 1,
                    slicer_id: 0,
                    request: {
                        hi: true,
                    }
                }
            });
            expect(slicer.dequeue()).toMatchObject({
                needsState: true,
                slice: {
                    slicer_order: 1,
                    slicer_id: 0,
                    request: {
                        hi: true,
                    }
                }
            });

            expect(slicer.dequeue()).toMatchObject({
                needsState: true,
                slice: {
                    slicer_order: 1,
                    slicer_id: 0,
                    request: {
                        hi: true,
                    }
                }
            });

            expect(slicer.dequeue()).toBeNil();
        });
    });
});
