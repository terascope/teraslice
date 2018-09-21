import _ from 'lodash';
import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
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
        const exConfig = newTestExecutionConfig();

        exConfig.operations.push({
            _op: 'example-op',
        });

        exConfig.slicers = 3;

        const opConfig = exConfig.operations[0];

        slicer = new ExampleParallelSlicer(context, opConfig, exConfig);
        await slicer.initialize([]);
    });

    describe('->handle', () => {
        it('should resolve with 1 slice', async () => {
            const done = await slicer.handle();
            expect(done).toBeFalse();

            expect(slicer.getSlice()).toMatchObject({
                needsState: true,
                slice: {
                    slicer_order: 1,
                    slicer_id: 0,
                    request: {
                        hi: true,
                    }
                }
            });
            expect(slicer.getSlice()).toMatchObject({
                needsState: true,
                slice: {
                    slicer_order: 1,
                    slicer_id: 0,
                    request: {
                        hi: true,
                    }
                }
            });

            expect(slicer.getSlice()).toMatchObject({
                needsState: true,
                slice: {
                    slicer_order: 1,
                    slicer_id: 0,
                    request: {
                        hi: true,
                    }
                }
            });

            expect(slicer.getSlice()).toBeNil();
        });
    });
});
