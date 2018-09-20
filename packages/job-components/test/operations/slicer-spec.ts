import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { Slicer, SlicerResult } from '../../src';

describe('Slicer', () => {
    class ExampleSlicer extends Slicer {
        public async slice(): Promise<SlicerResult> {
            return [
                   { hi: true }
            ];
        }
    }

    let slicer: ExampleSlicer;

    beforeAll(async () => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        exConfig.operations.push({
            _op: 'example-op',
        });

        const opConfig = exConfig.operations[0];

        slicer = new ExampleSlicer(context, opConfig, exConfig);
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

            expect(slicer.dequeue()).toBeNil();
        });
    });
});
