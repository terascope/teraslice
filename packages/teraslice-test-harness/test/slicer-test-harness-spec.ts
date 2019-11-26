import 'jest-extended';
import path from 'path';
import {
    newTestJobConfig,
    Slicer
} from '@terascope/job-components';
import { SlicerTestHarness } from '../src';

describe('SlicerTestHarness', () => {
    const assetDir = path.join(__dirname, 'fixtures');
    const clients = [
        {
            type: 'example',
            create: () => ({
                client: {
                    say() {
                        return 'hello';
                    }
                }
            })
        }
    ];
    describe('when given a valid job config', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
            {
                _op: 'test-reader',
            },
            {
                _op: 'noop',
            }
        ];

        const slicerHarness = new SlicerTestHarness(job, {
            assetDir: path.join(__dirname, 'fixtures'),
            clients,
        });

        it('should be able to call initialize', () => expect(slicerHarness.initialize()).resolves.toBeNil());

        it('should throw if given recoveryData since slicer is not recoverable', async () => {
            expect.assertions(1);
            const lastSlice = {
                slice_id: 'someId',
                slicer_id: 0,
                slicer_order: 345,
                request: { some: 'stuff' },
                _created: new Date().toISOString()
            };
            try {
                await slicerHarness.initialize([{ lastSlice }]);
            } catch (err) {
                expect(err).toBeDefined();
            }
        });

        it('should have a slicer', () => {
            expect(slicerHarness.slicer()).toBeInstanceOf(Slicer);
        });

        it('should be able to call createSlices', async () => {
            const result = await slicerHarness.createSlices();
            expect(result).toBeArray();

            expect(result[0]).not.toHaveProperty('slice_id');
            expect(result[0]).not.toHaveProperty('slicer_id');
            expect(result[0]).not.toHaveProperty('slicer_order');
        });

        it('should be able to call createSlices with fullResponse', async () => {
            const result = await slicerHarness.createSlices({ fullResponse: true });
            expect(result).toBeArray();
            expect(result[0]).toHaveProperty('slice_id');
            expect(result[0]).toHaveProperty('slicer_id');
            expect(result[0]).toHaveProperty('slicer_order');
        });

        it('should be able to call shutdown', () => expect(slicerHarness.shutdown()).resolves.toBeNil());
    });

    describe('when given a slicer that is recoverable', () => {
        let slicerHarness: SlicerTestHarness;

        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
            {
                _op: 'recoverable-reader',
            },
            {
                _op: 'noop',
            }
        ];

        const lastSlice = {
            slice_id: 'someId',
            slicer_id: 0,
            slicer_order: 345,
            request: { count: 25 },
            _created: new Date().toISOString()
        };

        beforeEach(() => {
            slicerHarness = new SlicerTestHarness(job, {
                assetDir
            });
        });

        afterEach(async () => {
            await slicerHarness.shutdown();
        });

        it('should not throw if given recovery data', async () => {
            await slicerHarness.initialize([{ lastSlice }]);
        });

        it('should throw if recovery data is malformed', async () => {
            expect.assertions(2);
            const badRecoveryData = {
                slice_id: 'someId',
                slicer_id: 0,
                slicer_order: 345,
                _created: new Date().toISOString()
            };

            try {
                // @ts-ignore
                await slicerHarness.initialize([{ lastSlice: badRecoveryData }]);
            } catch (err) {
                expect(err).toBeDefined();
            }

            try {
                // @ts-ignore
                await slicerHarness.initialize(['asdfasdfasdf']);
            } catch (err) {
                expect(err).toBeDefined();
            }
        });

        it('can recovery to previous count', async () => {
            const expectedResults = { count: 26 };

            await slicerHarness.initialize([{ lastSlice }]);

            const [results] = await slicerHarness.createSlices();
            expect(results).toEqual(expectedResults);
        });
    });
});
