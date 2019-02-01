import 'jest-extended';
import path from 'path';
import { terasliceOpPath } from '../helpers';
import {
    WorkerExecutionContext,
    TestContext,
    newTestExecutionConfig,
    DataEntity,
    FetcherCore,
    ProcessorCore
} from '../../src';

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
                _name: 'example-observer'
            },
            {
                _name: 'example-api'
            }
        ];

        executionConfig.operations = [
            {
                _op: 'example-reader'
            },
            {
                _op: 'example-op'
            }
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
                }
            ]);

            for (const processor of executionContext.processors) {
                const result = await processor.handle(input);
                expect(result).toBeArrayOfSize(1);
                expect(result[0]).toHaveProperty('touchedAt');
            }
        });

        it('should have the APIs', () => {
            expect(Object.keys(executionContext.apis)).toEqual([
                'example-observer',
                'example-api',
            ]);
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
            expect(registry).toEqual([
                'example-reader',
            ]);
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
            await executionContext.onSliceInitialized('hello');
            await executionContext.onSliceStarted('hello');
            await executionContext.onSliceFinalizing('hello');
            await executionContext.onSliceFinished('hello');
            await executionContext.onSliceFailed('hello');
            await executionContext.onSliceRetry('hello');
            await executionContext.onOperationStart('hello', 1);
            await executionContext.onOperationComplete('hello', 1, 1);
        });

        it('should be able run a "slice"', async () => {
            const slice = {
                slice_id: '1',
                slicer_id: 1,
                slicer_order: 1,
                request: { hello: true },
                _created: 'hi'
            };

            const { results, analytics } = await executionContext.runSlice(slice);

            expect(analytics).toBeUndefined();

            expect(results.length).toBeGreaterThan(0);

            for (const item of results) {
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('data');
                expect(item).toHaveProperty('touchedAt');
            }
        });
    });

    describe('when testing edge cases', () => {
        const executionConfig = newTestExecutionConfig();
        executionConfig.operations = [
            {
                _op: 'failing-reader'
            },
            {
                _op: 'noop'
            }
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
                _created: 'hi'
            };

            return expect(executionContext.runSlice(slice))
                        .rejects.toThrowError(/Failure to parse buffer/);
        });
    });
});
