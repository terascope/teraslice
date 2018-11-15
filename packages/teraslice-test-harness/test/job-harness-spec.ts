import 'jest-extended';
import {
    newTestJobConfig,
    Assignment,
    newTestSlice,
    RunSliceResult,
    DataEntity,
    SliceRequest,
    Slice
} from '@terascope/job-components';
import { JobHarness } from '../src';

describe('JobHarness', () => {
    const clients = [
        {
            type: 'example',
            client: {
                say() {
                    return 'hello';
                }
            }
        }
    ];
    describe('assignment === "worker"', () => {
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

            const jobHarness = new JobHarness(job, {
                assignment: Assignment.Worker,
                assetDir: __dirname,
                clients
            });

            it('should be able to call initialize', () => {
                return expect(jobHarness.initialize()).resolves.toBeNil();
            });

            it('should be able to call runSlice', async () => {
                const result = await jobHarness.runSlice(newTestSlice()) as DataEntity[];
                expect(result).toBeArray();
            });

            it('should be able to call runSlice with fullResponse', async () => {
                const result = await jobHarness.runSlice(newTestSlice(), { fullResponse: true }) as RunSliceResult;
                expect(result.analytics).not.toBeNil();
                expect(result.results).toBeArray();
            });

            it('should not be able to call createSlices', () => {
                const errorMsg = 'createSlices can only be run with assignment of "execution_controller"';
                return expect(jobHarness.createSlices()).rejects.toThrowError(errorMsg);
            });

            it('should be able to call cleanup', () => {
                return expect(jobHarness.cleanup()).resolves.toBeNil();
            });
        });
    });

    describe('assignment === "execution_controller"', () => {
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

            const jobHarness = new JobHarness(job, {
                assignment: Assignment.ExecutionController,
                assetDir: __dirname,
                clients,
            });

            it('should be able to call initialize', () => {
                return expect(jobHarness.initialize()).resolves.toBeNil();
            });

            it('should be able to call createSlices', async () => {
                const result = await jobHarness.createSlices() as SliceRequest[];
                expect(result).toBeArray();

                expect(result[0]).not.toHaveProperty('slice_id');
                expect(result[0]).not.toHaveProperty('slicer_id');
                expect(result[0]).not.toHaveProperty('slicer_order');
            });

            it('should be able to call createSlices with fullResponse', async () => {
                const result = await jobHarness.createSlices({ fullResponse: true }) as Slice[];
                expect(result).toBeArray();
                expect(result[0]).toHaveProperty('slice_id');
                expect(result[0]).toHaveProperty('slicer_id');
                expect(result[0]).toHaveProperty('slicer_order');
            });

            it('should not be able to call runSlice', () => {
                const errorMsg = 'runSlice can only be run with assignment of "worker"';
                return expect(jobHarness.runSlice(newTestSlice())).rejects.toThrowError(errorMsg);
            });

            it('should be able to call cleanup', () => {
                return expect(jobHarness.cleanup()).resolves.toBeNil();
            });
        });
    });
});
