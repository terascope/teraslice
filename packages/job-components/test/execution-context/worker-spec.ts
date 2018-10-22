import 'jest-extended';
import path from 'path';
import { terasliceOpPath } from '../helpers';
import {
    WorkerExecutionContext,
    TestContext,
    newTestExecutionConfig,
    DataEntity
} from '../../src';

describe('WorkerExecutionContext', () => {
    const assetIds = ['fixtures'];
    const assetDir = path.join(__dirname, '..');
    const executionConfig = newTestExecutionConfig();
    executionConfig.operations = [
        {
            _op: 'example-reader'
        },
        {
            _op: 'example-op'
        }
    ];

    describe('when constructed', () => {
        const context = new TestContext('worker-execution-context');
        context.sysconfig.teraslice.assets_directory = assetDir;

        const events = context.apis.foundation.getSystemEvents();

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
            const result = await executionContext.fetcher.handle({});
            expect(result.toArray()).toBeArrayOfSize(10);
        });

        it('should have the Processors', async () => {
            expect(executionContext).toHaveProperty('processors');
            expect(executionContext.processors.size).toEqual(1);
            const input = DataEntity.makeList([
                {
                    hello: true,
                }
            ]);

            for (const processor of executionContext.processors.values()) {
                const result = await processor.handle(input);
                expect(result.toArray()).toBeArrayOfSize(1);
                expect(result.toArray()[0]).toHaveProperty('touchedAt');
            }
        });

        it('should have the registered apis', () => {
            const registry = Object.keys(context.apis.executionContext.registry);
            expect(registry).toEqual([
                'example-reader'
            ]);
        });

        it('should have the operations initialized', () => {
            const ops = executionContext.getOperations();
            for (const op of ops) {
                expect(op).toHaveProperty('initialized', true);
            }
        });

        it('should be to call the Worker LifeCycle events', async () => {
            const onSliceInit = jest.fn();
            events.on('slice:initialize', onSliceInit);

            const onSliceSuccess = jest.fn();
            events.on('slice:success', onSliceSuccess);

            const onSliceFinalize = jest.fn();
            events.on('slice:finalize', onSliceFinalize);

            const onSliceFailure = jest.fn();
            events.on('slice:failure', onSliceFailure);

            const onSliceRetry = jest.fn();
            events.on('slice:retry', onSliceRetry);

            expect(onSliceInit).not.toHaveBeenCalled();
            await executionContext.onSliceInitialized('hello');
            expect(onSliceInit).toHaveBeenCalled();

            await executionContext.onSliceStarted('hello');

            expect(onSliceSuccess).not.toHaveBeenCalled();
            await executionContext.onSliceFinalizing('hello');
            expect(onSliceSuccess).toHaveBeenCalled();

            expect(onSliceFinalize).not.toHaveBeenCalled();
            await executionContext.onSliceFinished('hello');
            expect(onSliceFinalize).toHaveBeenCalled();

            expect(onSliceFailure).not.toHaveBeenCalled();

            expect(onSliceFailure).not.toHaveBeenCalled();
            await executionContext.onSliceFailed('hello');
            expect(onSliceFailure).toHaveBeenCalled();

            expect(onSliceRetry).not.toHaveBeenCalled();
            await executionContext.onSliceRetry('hello');
            expect(onSliceRetry).toHaveBeenCalled();
        });

        it('should be able run a "slice"', async () => {
            const slice = {
                slice_id: '1',
                slicer_id: 1,
                slicer_order: 1,
                request: { hello: true },
                _created: 'hi'
            };

            const result = await executionContext.runSlice(slice);

            expect(result.length).toBeGreaterThan(0);

            for (const item of result) {
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('data');
                expect(item).toHaveProperty('touchedAt');
            }
        });
    });
});
