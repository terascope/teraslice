import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pDelay, DataEntity, isKey } from '@terascope/core-utils';
import {
    WorkerExecutionContext, TestContext, newTestExecutionConfig,
    FetcherCore, ProcessorCore, newTestSlice
} from '../../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('WorkerExecutionContext', () => {
    const assetIds = ['fixtures'];
    const assetDir = path.join(dirname, '..');

    const context = new TestContext('worker-execution-context');

    context.sysconfig.teraslice.assets_directory = assetDir;

    const events = context.apis.foundation.getSystemEvents();

    describe('when constructed', () => {
        const executionConfig = newTestExecutionConfig({
            analytics: true,
            apis: [
                {
                    _name: 'example-observer',
                },
                {
                    _name: 'example-api',
                },
            ],
            operations: [
                {
                    _op: 'example-reader',
                },
                {
                    _op: 'delay',
                    ms: 1000,
                },
                {
                    _op: 'example-op',
                    test_flush: true,
                },
            ],
        });

        let executionContext: WorkerExecutionContext;

        beforeAll(async () => {
            executionContext = await WorkerExecutionContext.createContext({
                context,
                executionConfig,
                assetIds,
            });

            await executionContext.initialize();
        });

        afterAll(async () => {
            events.removeAllListeners();
            await executionContext.shutdown();
        });

        it('should have correct properties', () => {
            expect(executionContext).toHaveProperty('config', executionConfig);
            expect(executionContext).toHaveProperty('assetIds', ['fixtures']);
            expect(executionContext).toHaveProperty('context');
        });

        it('should have the Fetcher', async () => {
            expect(executionContext).toHaveProperty('fetcher');
            const result = await executionContext.fetcher().handle({});
            expect(result).toBeArrayOfSize(10);
        });

        it('should have the Processors', async () => {
            expect(executionContext).toHaveProperty('processors');
            expect(executionContext.processors.length).toEqual(2);

            const input = DataEntity.makeArray([
                {
                    hello: true,
                },
            ]);

            for (const processor of executionContext.processors) {
                if (processor.opConfig._op !== 'example-op') continue;
                const result = await processor.handle(input);
                expect(result).toBeArrayOfSize(1);
                expect(result[0]).toHaveProperty('touchedAt');
            }
        });

        it('should have the registered APIs', () => {
            const registeredAPIs = Object.keys(executionContext.apis);
            // this test is order specific to ensure everything is loaded correctly
            expect(registeredAPIs).toEqual(['job-observer', 'example-observer', 'example-api', 'example-reader']);
        });

        it('should be able to get the example-api', async () => {
            const delay = executionContext.getOperation('delay');
            const api = await delay.getAPI('example-api');
            expect(api).not.toBeNil();
        });

        it('should be able to create the example-api', async () => {
            const delay = executionContext.getOperation('delay');
            const api = await delay.createAPI('example-api');
            expect(api).not.toBeNil();

            expect(delay.getAPI('example-api')).toBe(api);
        });

        it('should be able to an operation instance by index', async () => {
            const fetcher = executionContext.getOperation<FetcherCore>(0);
            expect(fetcher.opConfig._op).toEqual('example-reader');

            const delay = executionContext.getOperation<ProcessorCore>(1);
            expect(delay.opConfig._op).toEqual('delay');

            const processor = executionContext.getOperation<ProcessorCore>(2);
            expect(processor.opConfig._op).toEqual('example-op');
        });

        it('should be able to an operation instance by name', async () => {
            const fetcher = executionContext.getOperation<FetcherCore>('example-reader');
            expect(fetcher.opConfig._op).toEqual('example-reader');

            const delay = executionContext.getOperation<ProcessorCore>('delay');
            expect(delay.opConfig._op).toEqual('delay');

            const processor = executionContext.getOperation<ProcessorCore>('example-op');
            expect(processor.opConfig._op).toEqual('example-op');
        });

        it('should have the operations initialized', () => {
            const ops = executionContext.getOperations();

            for (const op of ops) {
                // @ts-expect-error
                const isDelay = op.opConfig && op.opConfig._op === 'delay';
                if (op.onOperationComplete == null && !isDelay) {
                    expect(op).toHaveProperty('_initialized', true);
                }
            }
        });

        it('should be to call the Worker LifeCycle events', async () => {
            await executionContext.initializeSlice(newTestSlice());
            expect(executionContext.status).toEqual('running');
            expect(executionContext).toHaveProperty('sliceState.status', 'starting');
            await executionContext.onSliceStarted();
            expect(executionContext).toHaveProperty('sliceState.status', 'started');
            await executionContext.onSliceFinalizing();
            await executionContext.onSliceFinished();
            expect(executionContext.status).toEqual('idle');
            await executionContext.onSliceFailed();
            expect(executionContext).toHaveProperty('sliceState.status', 'failed');
            await executionContext.onSliceRetry();
            executionContext.sliceState = undefined;
        });

        it('should be able run a "slice"', async () => {
            await executionContext.initializeSlice(newTestSlice());
            expect(executionContext).toHaveProperty('sliceState.status', 'starting');

            const { results, analytics, status } = await executionContext.runSlice();
            expect(status).toEqual('completed');
            expect(executionContext).toHaveProperty('sliceState.status', status);
            expect(executionContext.status).toEqual('running');

            expect(analytics).toContainAllKeys(['time', 'memory', 'size']);

            expect(results.length).toBeGreaterThan(0);

            for (const item of results) {
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('data');
                expect(item).toHaveProperty('touchedAt');
            }
        });

        it('should be able run a flush on the last slice', async () => {
            const op: any = executionContext.getOperation('example-op');

            expect(op._flushing).toBeFalse();
            expect(executionContext).toHaveProperty('sliceState.status', 'completed');

            const previousAnalytics = executionContext.sliceState!.analytics!;

            const result = await executionContext.flush();
            if (!result) {
                expect(result).not.toBeNil();
                return;
            }

            const { results, analytics, status } = result;

            expect(status).toEqual('flushed');
            expect(executionContext.status).toEqual('flushing');

            expect(op._flushing).toBeFalse();

            expect(analytics).toContainAllKeys(['time', 'memory', 'size']);
            expect(analytics).not.toEqual(previousAnalytics);
            const ops = executionContext.config.operations.length;

            for (const metric of ['size', 'time']) {
                for (let i = 0; i < ops; i++) {
                    if (isKey(previousAnalytics, metric)) {
                        const previous = previousAnalytics[metric][i];
                        const current = analytics![metric][i];
                        if (i === 0) {
                            if (current !== previous) {
                                console.warn(`Metric "${metric}" should not have changed for the fetcher. Expected ${current} === ${previous}`);
                            }
                        } else if (current < previous) {
                            console.warn(`Metric "${metric}" should be greater than the last run. Expected ${current} >= ${previous}.`);
                        }
                    }
                }
            }

            expect(results.length).toEqual(30);

            for (const item of results) {
                expect(item).toHaveProperty('flush', true);
            }
        });

        it('should be able run a slice and flush at the same time', async () => {
            await executionContext.initializeSlice(newTestSlice());

            const running = executionContext.runSlice();
            const flushing = executionContext.flush();
            const [runResult, flushResult] = await Promise.all([running, flushing]);

            expect(runResult).toHaveProperty('status', 'flushed');
            expect(runResult).toHaveProperty('results');
            expect(runResult).toHaveProperty('analytics');
            expect(flushResult).toBeNil();
        });

        it('should be able flush a slice that is mid-way', async () => {
            await executionContext.initializeSlice(newTestSlice());

            const running = executionContext.runSlice();
            await pDelay(500);

            const flushing = executionContext.flush();
            const [runResult, flushResult] = await Promise.all([running, flushing]);

            expect(runResult).toHaveProperty('status', 'flushed');
            expect(runResult).toHaveProperty('results');
            expect(runResult).toHaveProperty('analytics');
            expect(flushResult).not.toBeNil();
            expect(flushResult).not.toEqual(runResult);
        });
    });

    describe('when testing edge cases', () => {
        const executionConfig = newTestExecutionConfig();
        executionConfig.operations = [
            {
                _op: 'failing-reader',
            },
            {
                _op: 'noop',
            },
        ];

        let executionContext: WorkerExecutionContext;

        beforeAll(async () => {
            executionContext = await WorkerExecutionContext.createContext({
                context,
                executionConfig,
                assetIds,
            });
            await executionContext.initialize();
        });

        afterAll(() => {
            events.removeAllListeners();
            return executionContext.shutdown();
        });

        it('should be able fail a "slice"', () => {
            const slice = {
                slice_id: '1',
                slicer_id: 1,
                slicer_order: 1,
                request: { hello: true },
                _created: 'hi',
            };

            return expect(executionContext.runSlice(slice)).rejects.toThrow(/Failure to parse buffer/);
        });
    });
});
