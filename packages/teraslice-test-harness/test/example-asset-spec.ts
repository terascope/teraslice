import path from 'path';
import { DataEntity, SliceRequest, TestClientConfig } from '@terascope/job-components';
import SimpleClient from './fixtures/asset/simple-connector/client';
import {
    JobTestHarness,
    newTestJobConfig,
    newTestSlice,
    SlicerTestHarness,
    WorkerTestHarness,
} from '../src';

jest.mock('./fixtures/asset/simple-connector/client');

describe('Example Asset', () => {
    const assetDir = path.join(__dirname, 'fixtures');
    const simpleClient = new SimpleClient();
    const clientConfig: TestClientConfig = {
        type: 'simple-client',
        create: jest.fn(() => simpleClient),
    };

    beforeEach(() => {
        jest.restoreAllMocks();
        clientConfig.create = jest.fn(() => simpleClient);
    });

    describe('using the WorkerTestHarness', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
            {
                _op: 'simple-reader'
            },
            {
                _op: 'transformer',
                action: 'set',
                key: 'foo',
                setValue: 'bar',
            }
        ];

        let harness: WorkerTestHarness;

        beforeEach(async () => {
            // @ts-ignore
            simpleClient.fetchRecord.mockImplementation((id: number) => {
                return {
                    id,
                    data: {
                        a: 'b',
                        c: 'd',
                        e: 'f',
                    }
                };
            });

            harness = new WorkerTestHarness(job, {
                clients: [clientConfig],
                assetDir,
            });

            await harness.initialize();
        });

        afterEach(async () => {
            await harness.shutdown();
        });

        it('should call create client', () => {
            expect(clientConfig.create).toHaveBeenCalledTimes(1);
        });

        it('should return a list of records', async () => {
            const testSlice = newTestSlice();
            testSlice.request = { count: 10 };
            const results = await harness.runSlice(testSlice) as DataEntity[];

            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(10);

            for (const result of results) {
                expect(DataEntity.isDataEntity(result)).toBe(true);
                expect(result).toHaveProperty('foo', 'bar');
                expect(result.data).toEqual({
                    a: 'b',
                    c: 'd',
                    e: 'f',
                });
            }
        });
    });

    describe('using the SlicerTestHarness', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
            {
                _op: 'simple-reader'
            },
            {
                _op: 'noop'
            }
        ];

        let harness: SlicerTestHarness;

        beforeEach(async () => {
            // @ts-ignore
            simpleClient.sliceRequest.mockImplementation((count: number) => {
                return { count, super: 'man' };
            });

            harness = new SlicerTestHarness(job, {
                clients: [clientConfig],
                assetDir,
            });

            await harness.initialize();
        });

        afterEach(async () => {
            await harness.shutdown();
        });

        it('should call create client', () => {
            expect(clientConfig.create).toHaveBeenCalledTimes(1);
        });

        it('should return a list of records', async () => {
            const results = await harness.createSlices() as SliceRequest[];
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(10);

            for (const result of results) {
                expect(DataEntity.isDataEntity(result)).toBe(false);
                expect(result.count).toEqual(10);
                expect(result.super).toEqual('man');
            }
        });
    });

    describe('using the JobTestHarness', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
            {
                _op: 'simple-reader'
            },
            {
                _op: 'transformer',
                action: 'inc',
                key: 'scale',
                incBy: 5,
            },
            {
                _op: 'transformer',
                action: 'inc',
                key: 'scale',
                incBy: 1,
            }
        ];

        let harness: JobTestHarness;

        beforeEach(async () => {
            harness = new JobTestHarness(job, {
                clients: [clientConfig],
                assetDir,
            });

            await harness.initialize();
        });

        afterEach(async () => {
            await harness.shutdown();
        });

        it('should call create client', () => {
            expect(clientConfig.create).toHaveBeenCalledTimes(2);
        });

        it('should batches of results', async () => {
            const batches = await harness.run();

            expect(Array.isArray(batches)).toBe(true);
            expect(batches.length).toBe(10);

            for (const results of batches) {
                expect(Array.isArray(results)).toBe(true);
                expect(results.length).toBe(10);

                for (const result of results) {
                    expect(DataEntity.isDataEntity(result)).toBe(true);
                    expect(result.scale).toBe(6);
                }
            }
        });

        it('should be finished for the second batch of slices', async () => {
            const batches = await harness.run();

            // @ts-ignore
            simpleClient.isFinished.mockReturnValue(true);

            expect(Array.isArray(batches)).toBe(true);
            expect(batches.length).toBe(10);

            for (const results of batches) {
                expect(Array.isArray(results)).toBe(true);
                expect(results.length).toBe(10);

                for (const result of results) {
                    expect(DataEntity.isDataEntity(result)).toBe(true);
                    expect(result.scale).toBe(6);
                }
            }
        });
    });
});
