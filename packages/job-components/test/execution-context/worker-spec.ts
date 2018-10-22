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
                if (op.onOperationComplete == null) {
                    expect(op).toHaveProperty('initialized', true);
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
            await executionContext.onOperationComplete(1, 'hello', 1);
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
});
