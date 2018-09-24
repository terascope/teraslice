import _ from 'lodash';
import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { ParallelSlicer, SlicerFn } from '../../src';

describe('ParallelSlicer', () => {
    class ExampleParallelSlicer extends ParallelSlicer {
        newSlicerCalled = 0;
        public async newSlicer(): Promise<SlicerFn> {
            this.newSlicerCalled += 1;
            let called = 0;

            if (this.newSlicerCalled === 1) {
                return async () => {
                    called += 1;
                    if (called < 3) {
                        return { hi: true };
                    }
                    return null;
                };
            }

            return async () => {
                called += 1;
                if (called < 3) {
                    return { hello: true };
                }
                return null;
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

        exConfig.slicers = 2;

        const opConfig = exConfig.operations[0];

        slicer = new ExampleParallelSlicer(context, opConfig, exConfig);
        await slicer.initialize([]);
    });

    afterAll(() => {
        return slicer.shutdown();
    });

    describe('->handle', () => {
        describe('on the first call', () => {
            it('should resolve with 2 slices', async () => {
                const done = await slicer.handle();
                expect(done).toBeFalse();

                const slice1 = slicer.getSlice();

                if (!slice1) {
                    expect(slice1).toBeNil();
                } else if (slice1.slice.slicer_id === 0) {
                    expect(slice1).toMatchObject({
                        needsState: true,
                        slice: {
                            slicer_order: 1,
                            slicer_id: 0,
                            request: {
                                hi: true,
                            }
                        }
                    });
                } else {
                    expect(slice1).toMatchObject({
                        needsState: true,
                        slice: {
                            slicer_order: 1,
                            slicer_id: 1,
                            request: {
                                hello: true,
                            }
                        }
                    });
                }

                const slice2 = slicer.getSlice();

                if (!slice2) {
                    expect(slice2).toBeNil();
                } else if (slice2.slice.slicer_id === 0) {
                    expect(slice2).toMatchObject({
                        needsState: true,
                        slice: {
                            slicer_order: 1,
                            slicer_id: 0,
                            request: {
                                hi: true,
                            }
                        }
                    });
                } else {
                    expect(slice2).toMatchObject({
                        needsState: true,
                        slice: {
                            slicer_order: 1,
                            slicer_id: 1,
                            request: {
                                hello: true,
                            }
                        }
                    });
                }

                expect(slicer.getSlice()).toBeNil();
            });
        });

        describe('on the second call', () => {
            it('should resolve with 2 slices', async () => {
                const done = await slicer.handle();
                expect(done).toBeFalse();

                const slice1 = slicer.getSlice();

                if (!slice1) {
                    expect(slice1).toBeNil();
                } else if (slice1.slice.slicer_id === 0) {
                    expect(slice1).toMatchObject({
                        needsState: true,
                        slice: {
                            slicer_order: 2,
                            slicer_id: 0,
                            request: {
                                hi: true,
                            }
                        }
                    });
                } else {
                    expect(slice1).toMatchObject({
                        needsState: true,
                        slice: {
                            slicer_order: 2,
                            slicer_id: 1,
                            request: {
                                hello: true,
                            }
                        }
                    });
                }

                const slice2 = slicer.getSlice();

                if (!slice2) {
                    expect(slice2).toBeNil();
                } else if (slice2.slice.slicer_id === 0) {
                    expect(slice2).toMatchObject({
                        needsState: true,
                        slice: {
                            slicer_order: 2,
                            slicer_id: 0,
                            request: {
                                hi: true,
                            }
                        }
                    });
                } else {
                    expect(slice2).toMatchObject({
                        needsState: true,
                        slice: {
                            slicer_order: 2,
                            slicer_id: 1,
                            request: {
                                hello: true,
                            }
                        }
                    });
                }

                expect(slicer.getSlice()).toBeNil();
            });
        });

        describe('on the third call', () => {
            it('should resolve with 0 slices', async () => {
                const done = await slicer.handle();
                expect(done).toBeTrue();

                expect(slicer.getSlice()).toBeNil();
            });
        });
    });
});
