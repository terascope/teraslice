import 'jest-extended';
import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    newTestJobConfig,
    newTestSlice,
    Fetcher,
    BatchProcessor,
    NoopProcessor,
    TestClientConfig
} from '@terascope/job-components';
import { DataEntity, debugLogger } from '@terascope/core-utils';
import { WorkerTestHarness } from '../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('WorkerTestHarness', () => {
    const logger = debugLogger('WorkerTestHarness');

    const clients: TestClientConfig[] = [
        {
            type: 'example',
            createClient: async () => ({
                client: {
                    say() {
                        return 'hello';
                    }
                },
                logger
            })
        }
    ];

    describe('when given a valid job config', () => {
        const job = newTestJobConfig({
            max_retries: 2,
            analytics: true,
            operations: [
                {
                    _op: 'test-reader',
                },
                {
                    _op: 'noop',
                },
            ],
        });

        const workerHarness = new WorkerTestHarness(job, {
            assetDir: path.join(dirname, 'fixtures'),
            clients,
        });

        beforeAll(async () => {
            await workerHarness.initialize();
            workerHarness.processors[0].handle = jest.fn(async (data: DataEntity[]) => data);
        });

        it('should be able to call initialize', () => expect(workerHarness.initialize).toBeFunction());

        it('should have fetcher', () => {
            expect(workerHarness.fetcher()).toBeInstanceOf(Fetcher);
        });

        it('should have on processor', () => {
            expect(workerHarness.processors).toBeArrayOfSize(1);
            expect(workerHarness.processors[0]).toBeInstanceOf(BatchProcessor);
        });

        it('should be able to call runSlice', async () => {
            const result = await workerHarness.runSlice(newTestSlice());
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
        });

        it('should be able to call runSlice with just a request object', async () => {
            const result = await workerHarness.runSlice({ hello: true });
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
        });

        it('should call slice retry', async () => {
            const onSliceRetryEvent = jest.fn();
            workerHarness.events.on('slice:retry', onSliceRetryEvent);
            const err = new Error('oh no');

            workerHarness.processors[0].handle
                // @ts-expect-error
                .mockClear()
                .mockRejectedValueOnce(err)
                .mockRejectedValueOnce(err);

            const results = await workerHarness.runSlice({});
            expect(results).toBeArray();

            expect(onSliceRetryEvent).toHaveBeenCalledTimes(2);
            expect(workerHarness.getOperation<NoopProcessor>('noop').handle).toHaveBeenCalledTimes(3);
        });

        it('should be able to call runSlice with fullResponse', async () => {
            const result = await workerHarness.runSlice(newTestSlice(), { fullResponse: true });
            expect(result.analytics).not.toBeNil();
            expect(result.results).toBeArray();
        });

        it('should be able to call shutdown', () => expect(workerHarness.shutdown()).resolves.toBeNil());

        it('should not throw if shutdown is called before initialized', async () => {
            let test: WorkerTestHarness;

            try {
                test = new WorkerTestHarness(job, {
                    assetDir: path.join(dirname, 'fixtures'),
                    clients,
                });

                await expect(test.shutdown()).resolves.not.toThrow();
            } finally {
                // @ts-expect-error
                if (test) {
                    await test.shutdown();
                }
            }
        });
    });

    describe('when using assets and multiple assetDirs', () => {
        const options = {
            assetDir: [
                path.join(dirname, 'fixtures'),
                path.join(dirname, 'secondary-asset'),
            ]
        };
        let harness: WorkerTestHarness;

        beforeAll(async () => {
            const job = newTestJobConfig({
                max_retries: 0,
                analytics: true,
                operations: [
                    {
                        _op: 'test-reader',
                        passthrough_slice: true,
                    },
                    { _op: 'test-processor' },
                    { _op: 'other_processor' },
                ],
            });

            harness = new WorkerTestHarness(job, options);

            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should run', async () => {
            const expectedResults = { more: 'data' };
            const data = [
                DataEntity.make({ some: 'data' }, { test: expectedResults })
            ];

            const results = await harness.runSlice(data);

            expect(results).toBeArrayOfSize(1);
            expect(results[0]).toMatchObject(expectedResults);
            expect(results[0].getMetadata('other')).toBeTrue();
        });
    });

    describe('when using static method testProcessor', () => {
        const options = { assetDir: path.join(dirname, 'fixtures') };
        let harness: WorkerTestHarness;

        beforeAll(async () => {
            harness = WorkerTestHarness.testProcessor({ _op: 'noop' }, options);
            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should return an instance of the test harness', () => {
            expect(harness).toBeInstanceOf(WorkerTestHarness);
        });

        it('should be able run a slice', async () => {
            const data = [{ some: 'data' }];
            const results = await harness.runSlice(data);

            expect(results).toEqual(data);
        });
    });

    describe('when using static method testFetcher', () => {
        const options = { assetDir: path.join(dirname, 'fixtures') };
        let harness: WorkerTestHarness;

        beforeAll(async () => {
            harness = WorkerTestHarness.testFetcher(
                {
                    _op: 'test-reader',
                    passthrough_slice: true,
                },
                options
            );
            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should return an instance of the test harness', () => {
            expect(harness).toBeInstanceOf(WorkerTestHarness);
        });

        it('should be able to run a slice', async () => {
            const data = [{ some: 'data' }];
            const results = await harness.runSlice(data);

            expect(results).toEqual(data);
        });
    });

    describe('when testing flush', () => {
        const options = { assetDir: path.join(dirname, 'fixtures') };
        let harness: WorkerTestHarness;

        beforeAll(async () => {
            harness = WorkerTestHarness.testProcessor({ _op: 'simple-flush' }, options);
            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should flush any remaining records', async () => {
            const data = [{ some: 'data' }, { other: 'data' }];

            const emptyResults = await harness.runSlice(data);
            expect(emptyResults).toEqual([]);

            const flushedResults = await harness.flush();
            expect(flushedResults).toEqual(data);
        });
    });

    describe('when testing flush with analytics', () => {
        const options = { assetDir: path.join(dirname, 'fixtures') };
        let harness: WorkerTestHarness;

        beforeAll(async () => {
            const job = newTestJobConfig({
                max_retries: 0,
                analytics: true,
                operations: [
                    {
                        _op: 'test-reader',
                        passthrough_slice: true,
                    },
                    { _op: 'simple-flush' },
                ],
            });

            harness = new WorkerTestHarness(job, options);

            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should able return the result with analytics', async () => {
            const data = [{ some: 'data' }, { other: 'data' }];

            const emptyResults = await harness.runSlice(data);
            expect(emptyResults).toEqual([]);

            const flushedResults = await harness.flush({ fullResponse: true });

            expect(flushedResults).toHaveProperty('results', data);
            expect(flushedResults).toHaveProperty('status', 'flushed');
            expect(flushedResults).toHaveProperty('analytics');
            expect(flushedResults!.analytics).toContainKeys(['time', 'memory', 'size']);
        });
    });

    describe('harness preserves metadata of data passed in', () => {
        const options = { assetDir: path.join(dirname, 'fixtures') };
        let harness: WorkerTestHarness;

        beforeAll(async () => {
            const job = newTestJobConfig({
                max_retries: 0,
                analytics: true,
                operations: [
                    {
                        _op: 'test-reader',
                        passthrough_slice: true,
                    },
                    { _op: 'test-processor' },
                ],
            });

            harness = new WorkerTestHarness(job, options);

            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should able return the result with analytics', async () => {
            const data = [{ some: 'data' }, { other: 'data' }]
                .map((obj) => DataEntity.make(obj, { test: { i: 'am a test' } }));

            const results = await harness.runSlice(data);
            expect(results).toEqual([{ i: 'am a test' }, { i: 'am a test' }]);
        });
    });
});
