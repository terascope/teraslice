import 'jest-extended'; // require for type definitions
import {
    Slicer, SlicerResult, newTestExecutionConfig,
    TestContext, WorkerContext
} from '../../src/index.js';

describe('Slicer', () => {
    class ExampleSlicer<T = Record<string, any>> extends Slicer<T> {
        calls = 0;
        subslice = false;

        public async slice(): Promise<SlicerResult> {
            this.calls += 1;

            if (this.calls < 3) {
                return this.subslice ? [{ hi: true }] : { hi: true };
            }

            return null;
        }
    }

    describe('when returning a single-slice', () => {
        let slicer: ExampleSlicer;

        beforeAll(async () => {
            const context = new TestContext('teraslice-operations');
            const exConfig = newTestExecutionConfig();
            exConfig.operations.push({
                _op: 'example-op',
            });

            const opConfig = exConfig.operations[0];

            slicer = new ExampleSlicer(context as WorkerContext, opConfig, exConfig);
            await slicer.initialize([]);
        });

        describe('->handle', () => {
            describe('when called the first time', () => {
                it('should resolve false and enqueue 1 slice', async () => {
                    const done = await slicer.handle();
                    expect(done).toBeFalse();

                    expect(slicer.getSlice()).toMatchObject({
                        slicer_order: 1,
                        slicer_id: 0,
                        request: {
                            hi: true,
                        }
                    });

                    expect(slicer.getSlice()).toBeNil();
                });
            });

            describe('when called the second time', () => {
                it('should resolve false and enqueue 1 slice', async () => {
                    const done = await slicer.handle();
                    expect(done).toBeFalse();

                    expect(slicer.getSlice()).toMatchObject({
                        slicer_order: 2,
                        slicer_id: 0,
                        request: {
                            hi: true,
                        }
                    });

                    expect(slicer.getSlice()).toBeNil();
                });
            });

            describe('when called the third time', () => {
                it('should resolve true and enqueue no slice', async () => {
                    const done = await slicer.handle();
                    expect(done).toBeTrue();

                    expect(slicer.getSlice()).toBeNil();
                });
            });

            describe('when called a fourth time', () => {
                it('should resolve true and enqueue no slice', async () => {
                    const done = await slicer.handle();
                    expect(done).toBeTrue();

                    expect(slicer.getSlice()).toBeNil();
                });
            });
        });
    });

    describe('when returning a sub-slices', () => {
        let slicer: ExampleSlicer;
        const onSlicerSubslice = jest.fn();

        beforeAll(async () => {
            const context = new TestContext('teraslice-operations');

            const events = context.apis.foundation.getSystemEvents();

            events.on('slicer:subslice', onSlicerSubslice);

            const exConfig = newTestExecutionConfig();
            exConfig.operations.push({
                _op: 'example-op',
            });

            const opConfig = exConfig.operations[0];

            slicer = new ExampleSlicer(context as WorkerContext, opConfig, exConfig);
            slicer.subslice = true;

            await slicer.initialize([]);
        });

        describe('->handle', () => {
            it('should not emit slicer:subslice yet', () => {
                expect(onSlicerSubslice).not.toHaveBeenCalled();
            });

            describe('when called the first time', () => {
                it('should resolve false and enqueue 1 slice', async () => {
                    const done = await slicer.handle();
                    expect(done).toBeFalse();

                    expect(slicer.getSlice()).toMatchObject({
                        slicer_order: 1,
                        slicer_id: 0,
                        request: {
                            hi: true,
                        }
                    });

                    expect(onSlicerSubslice).toHaveBeenCalledTimes(1);

                    expect(slicer.getSlice()).toBeNil();
                });
            });

            describe('when called the second time', () => {
                it('should resolve false and enqueue 1 slice', async () => {
                    const done = await slicer.handle();
                    expect(done).toBeFalse();

                    expect(slicer.getSlice()).toMatchObject({
                        slicer_order: 2,
                        slicer_id: 0,
                        request: {
                            hi: true,
                        }
                    });

                    expect(onSlicerSubslice).toHaveBeenCalledTimes(2);

                    expect(slicer.getSlice()).toBeNil();
                });
            });

            describe('when called the third time', () => {
                it('should resolve true and enqueue no slice', async () => {
                    const done = await slicer.handle();
                    expect(done).toBeTrue();

                    expect(slicer.getSlice()).toBeNil();
                    expect(onSlicerSubslice).toHaveBeenCalledTimes(2);
                });
            });
        });
    });
});
