import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { Slicer, SlicerResult } from '../../src';

describe('Slicer', () => {
    class ExampleSlicer extends Slicer {
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

            slicer = new ExampleSlicer(context, opConfig, exConfig);
            await slicer.initialize([]);
        });

        describe('->handle', () => {
            describe('when called the first time', () => {
                it('should resolve false and enqueue 1 slice', async () => {
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

                    expect(slicer.getSlice()).toBeNil();
                });
            });

            describe('when called the second time', () => {
                it('should resolve false and enqueue 1 slice', async () => {
                    const done = await slicer.handle();
                    expect(done).toBeFalse();

                    expect(slicer.getSlice()).toMatchObject({
                        needsState: true,
                        slice: {
                            slicer_order: 2,
                            slicer_id: 0,
                            request: {
                                hi: true,
                            }
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
        const onExecutionSubslice = jest.fn();

        beforeAll(async () => {
            const context = new TestContext('teraslice-operations');

            const events = context.apis.foundation.getSystemEvents();

            events.on('execution:subslice', onExecutionSubslice);

            const exConfig = newTestExecutionConfig();
            exConfig.operations.push({
                _op: 'example-op',
            });

            const opConfig = exConfig.operations[0];

            slicer = new ExampleSlicer(context, opConfig, exConfig);
            slicer.subslice = true;

            await slicer.initialize([]);
        });

        describe('->handle', () => {
            it('should not emit execution:subslice yet', () => {
                expect(onExecutionSubslice).not.toHaveBeenCalled();
            });

            describe('when called the first time', () => {
                it('should resolve false and enqueue 1 slice', async () => {
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

                    expect(onExecutionSubslice).toHaveBeenCalledTimes(1);

                    expect(slicer.getSlice()).toBeNil();
                });
            });

            describe('when called the second time', () => {
                it('should resolve false and enqueue 1 slice', async () => {
                    const done = await slicer.handle();
                    expect(done).toBeFalse();

                    expect(slicer.getSlice()).toMatchObject({
                        needsState: true,
                        slice: {
                            slicer_order: 2,
                            slicer_id: 0,
                            request: {
                                hi: true,
                            }
                        }
                    });

                    expect(onExecutionSubslice).toHaveBeenCalledTimes(2);

                    expect(slicer.getSlice()).toBeNil();
                });
            });

            describe('when called the third time', () => {
                it('should resolve true and enqueue no slice', async () => {
                    const done = await slicer.handle();
                    expect(done).toBeTrue();

                    expect(slicer.getSlice()).toBeNil();
                    expect(onExecutionSubslice).toHaveBeenCalledTimes(2);
                });
            });
        });
    });
});
