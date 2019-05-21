import 'jest-extended';
import path from 'path';
import { terasliceOpPath } from '../helpers';
import {
    WorkerExecutionContext,
    TestContext,
    newTestExecutionConfig,
    DataEntity,
    FetcherCore,
    ProcessorCore,
    newTestSlice,
} from '../../src';
import ExampleBatch from '../fixtures/example-op/processor';

describe('WorkerExecutionContext', () => {
    const assetIds = ['fixtures'];
    const assetDir = path.join(__dirname, '..');

    const context = new TestContext('worker-execution-context');

    context.sysconfig.teraslice.assets_directory = assetDir;

    const events = context.apis.foundation.getSystemEvents();

    describe('when constructed', () => {
        const executionConfig = newTestExecutionConfig();

        executionConfig.apis = [
            {
                _name: 'example-observer',
            },
            {
                _name: 'example-api',
            },
        ];

        executionConfig.operations = [
            {
                _op: 'example-reader',
            },
            {
                _op: 'example-op',
                test_flush: true,
            },
        ];

        const executionContext = new WorkerExecutionContext({
            context,
            executionConfig,
            assetIds,
            terasliceOpPath,
        });

        beforeAll(async () => {
            expect(executionContext).toHaveProperty('status', 'initializing');
            await executionContext.initialize();
            expect(executionContext).toHaveProperty('status', 'idle');
        });

        afterAll(async () => {
            events.removeAllListeners();
            await executionContext.shutdown();
            expect(executionContext).toHaveProperty('status', 'shutdown');
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
            expect(executionContext.processors.length).toEqual(1);
            const input = DataEntity.makeArray([
                {
                    hello: true,
                },
            ]);

            for (const processor of executionContext.processors) {
                const result = await processor.handle(input);
                expect(result).toBeArrayOfSize(1);
                expect(result[0]).toHaveProperty('touchedAt');
            }
        });

        it('should have the APIs', () => {
            expect(Object.keys(executionContext.apis)).toEqual(['example-observer', 'example-api']);
        });

        it('should be able to an operation instance by index', async () => {
            const fetcher = executionContext.getOperation<FetcherCore>(0);
            // @ts-ignore
            expect(fetcher.opConfig._op).toEqual('example-reader');

            const processor = executionContext.getOperation<ProcessorCore>(1);
            // @ts-ignore
            expect(processor.opConfig._op).toEqual('example-op');
        });

        it('should be able to an operation instance by name', async () => {
            const fetcher = executionContext.getOperation<FetcherCore>('example-reader');
            // @ts-ignore
            expect(fetcher.opConfig._op).toEqual('example-reader');

            const processor = executionContext.getOperation<ProcessorCore>('example-op');
            // @ts-ignore
            expect(processor.opConfig._op).toEqual('example-op');
        });

        it('should have the registered apis', () => {
            const registry = Object.keys(context.apis.executionContext.registry);
            expect(registry).toEqual(['example-reader']);
        });

        it('should have the operations initialized', () => {
            const ops = executionContext.getOperations();
            for (const op of ops) {
                if (op.onOperationComplete == null) {
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

            expect(analytics).toBeUndefined();

            expect(results.length).toBeGreaterThan(0);

            for (const item of results) {
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('data');
                expect(item).toHaveProperty('touchedAt');
            }
        });

        it('should be able run a flush on the last slice', async () => {
            const op: ExampleBatch = executionContext.getOperation('example-op');

            expect(op._flushing).toBeFalse();
            expect(executionContext).toHaveProperty('sliceState.status', 'completed');

            const result = await executionContext.flush();
            if (!result) {
                expect(result).not.toBeNil();
                return;
            }

            const { results, analytics, status } = result;

            expect(status).toEqual('flushed');
            expect(executionContext.status).toEqual('flushing');

            expect(op._flushing).toBeFalse();

            expect(analytics).toBeUndefined();

            expect(results.length).toEqual(10);

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

        const executionContext = new WorkerExecutionContext({
            context,
            executionConfig,
            assetIds,
            terasliceOpPath,
        });

        beforeAll(() => {
            return executionContext.initialize();
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

            return expect(executionContext.runSlice(slice)).rejects.toThrowError(/Failure to parse buffer/);
        });
    });
});
