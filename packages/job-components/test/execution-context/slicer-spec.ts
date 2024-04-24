import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { terasliceOpPath } from '../helpers/index.js';
import {
    SlicerExecutionContext, TestContext, newTestExecutionConfig
} from '../../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SlicerExecutionContext', () => {
    const assetIds = ['fixtures'];
    const assetDir = path.join(dirname, '..');
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
        const context = new TestContext('slicer-execution-context');
        context.sysconfig.teraslice.assets_directory = assetDir;

        const executionContext = new SlicerExecutionContext({
            context,
            executionConfig,
            assetIds,
            terasliceOpPath,
        });

        beforeAll(() => executionContext.initialize());

        afterAll(() => executionContext.shutdown());

        it('should have correct properties', () => {
            expect(executionContext).toHaveProperty('config', executionConfig);
            expect(executionContext).toHaveProperty('assetIds', ['fixtures']);
            expect(executionContext).toHaveProperty('context');
        });

        it('should have the Slicer', async () => {
            expect(executionContext).toHaveProperty('slicer');
            const result = await executionContext.slicer().handle();
            expect(result).toBeFalse();
        });

        it('should not have the registered apis', () => {
            const registry = Object.keys(context.apis.executionContext.registry);
            expect(registry).toBeArrayOfSize(0);
        });

        it('should have the operations initialized', () => {
            const ops = executionContext.getOperations();
            for (const op of ops) {
                expect(op).toHaveProperty('_initialized', true);
            }
        });

        it('should be to call the Slicer LifeCycle events', () => {
            const stats = {
                workers: {
                    connected: 10,
                    available: 2,
                },
                slices: {
                    processed: 5,
                    failed: 1
                }
            };

            const slice = {
                slice_id: '1',
                slicer_id: 1,
                slicer_order: 1,
                request: { hello: true },
                _created: 'hi'
            };

            executionContext.onExecutionStats(stats);
            expect(executionContext.slicer()).toHaveProperty('stats', stats);

            executionContext.onSliceComplete({
                slice,
                analytics: {
                    time: [],
                    memory: [],
                    size: [],
                }
            });

            executionContext.onSliceDispatch(slice);
            executionContext.onSliceEnqueued(slice);
        });
    });
});
