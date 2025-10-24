import 'jest-extended';
import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TestClientConfig, debugLogger } from '@terascope/job-components';
import { DataEntity } from '@terascope/entity-utils';
import SimpleClient from './fixtures/asset/simple-connector/client';
import {
    JobTestHarness, newTestJobConfig, newTestSlice,
    SlicerTestHarness, WorkerTestHarness
} from '../src/index.js';
import SimpleAPIClass from './fixtures/asset/simple-api/api.js';
import { SimpleAPI } from './fixtures/asset/simple-api/interfaces.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Example Asset', () => {
    const assetDir = path.join(dirname, 'fixtures');
    const logger = debugLogger('example-asset');
    const apiName = 'simple-api';
    const simpleClient = new SimpleClient();
    const clientConfig: TestClientConfig = {
        type: 'simple-client',
        createClient: jest.fn(async () => ({ client: simpleClient, logger })),
    };

    beforeEach(() => {
        clientConfig.createClient = jest.fn(async () => ({ client: simpleClient, logger }));
    });

    describe('using the WorkerTestHarness', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.apis = [
            {
                _name: apiName,
            },
        ];
        job.operations = [
            {
                _op: 'simple-reader',
            },
            {
                _op: 'transformer',
                action: 'set',
                key: 'foo',
                setValue: 'bar',
            },
        ];

        let harness: WorkerTestHarness;

        beforeEach(async () => {
            // @ts-expect-error
            simpleClient.fetchRecord = jest.fn((id: number) => ({
                id,
                data: {
                    a: 'b',
                    c: 'd',
                    e: 'f',
                },
            }));

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
            expect(clientConfig.createClient).toHaveBeenCalledTimes(1);
        });

        it('should return a list of records', async () => {
            const testSlice = newTestSlice();
            testSlice.request = { count: 10 };
            const results = await harness.runSlice(testSlice);

            expect(results).toBeArrayOfSize(10);

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

        it('should have use the simple api', async () => {
            expect(Object.keys(harness.apis)).toContain('simple-api');

            const api = harness.apis['simple-api'].opAPI as SimpleAPI;

            expect(api).toHaveProperty('count', 0);
        });

        it('can get apis using getOperationAPI', async () => {
            const api = harness.getOperationAPI<SimpleAPIClass>(apiName);

            expect(api).toBeInstanceOf(SimpleAPIClass);
        });

        it('can get apis using getAPI', async () => {
            const api = harness.getAPI<SimpleAPI>(apiName);

            expect(api).toMatchObject({
                count: expect.any(Number),
                add: expect.any(Function),
                sub: expect.any(Function),
            });
        });
    });

    describe('using the SlicerTestHarness', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
            {
                _op: 'simple-reader',
            },
            {
                _op: 'noop',
            },
        ];

        let harness: SlicerTestHarness;

        beforeEach(async () => {
            const mockedSliceRequest = jest.fn((count: number) => ({ count, super: 'man' }));
            simpleClient.sliceRequest = mockedSliceRequest;

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
            expect(clientConfig.createClient).toHaveBeenCalledTimes(1);
        });

        it('should return a list of records', async () => {
            const results = await harness.createSlices() as any[];
            expect(results).toBeArrayOfSize(10);

            for (const result of results) {
                expect(DataEntity.isDataEntity(result)).toBe(false);
                expect(result?.count).toEqual(10);
                expect(result?.super).toEqual('man');
            }
        });
    });

    describe('using the JobTestHarness', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.apis = [
            {
                _name: 'simple-api',
            },
        ];
        job.operations = [
            {
                _op: 'simple-reader',
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
            },
        ];

        let harness: JobTestHarness;

        beforeEach(async () => {
            harness = new JobTestHarness(job, {
                clients: [clientConfig],
                assetDir,
            });

            await harness.initialize();
            const mockedSliceRequest = jest.fn((count: number) => ({ count }));
            simpleClient.sliceRequest = mockedSliceRequest;
        });

        afterEach(async () => {
            await harness.shutdown();
        });

        it('should call create client', () => {
            expect(clientConfig.createClient).toHaveBeenCalledTimes(2);
        });

        it('should batches of results', async () => {
            const batches = await harness.run();

            expect(batches).toBeArrayOfSize(10);

            for (const results of batches) {
                expect(results).not.toBeNull();
                expect(results).toBeArrayOfSize(10);

                for (const result of results as any) {
                    expect(DataEntity.isDataEntity(result)).toBe(true);
                    expect(result.scale).toBe(6);
                }
            }
        });

        it('should have one api', async () => {
            expect(Object.keys(harness.apis)).toContain('simple-api');
        });

        it('should be finished for the second batch of slices', async () => {
            const batches = await harness.run();

            // @ts-expect-error
            simpleClient.isFinished = true;

            expect(batches).toBeArrayOfSize(10);

            for (const results of batches) {
                expect(results).not.toBeNull();
                expect(results).toBeArrayOfSize(10);

                for (const result of results as any) {
                    expect(DataEntity.isDataEntity(result)).toBe(true);
                    expect(result.scale).toBe(6);
                }
            }
        });
    });
});
