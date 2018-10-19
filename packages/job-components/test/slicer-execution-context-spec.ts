import 'jest-extended';
import path from 'path';
import { terasliceOpPath } from './helpers';
import {
    SlicerExecutionContext,
    TestContext,
    newTestExecutionConfig
} from '../src';

describe('SlicerExecutionContext', () => {
    const assetIds = ['fixtures'];
    const assetDir = path.join(__dirname);
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

        beforeAll(() => {
            return executionContext.initialize();
        });

        afterAll(() => {
            return executionContext.shutdown();
        });

        it('should have correct properties', () => {
            expect(executionContext).toHaveProperty('config', executionConfig);
            expect(executionContext).toHaveProperty('assetIds', ['fixtures']);
            expect(executionContext).toHaveProperty('context');
        });

        it('should have the Slicer', async () => {
            expect(executionContext).toHaveProperty('slicer');
            const result = await executionContext.slicer.handle();
            expect(result).toBeFalse();
        });

        it('should not have the registered apis', () => {
            const registry = Object.keys(context.apis.executionContext.registry);
            expect(registry).toBeArrayOfSize(0);
        });

        it('should have the operations initialized', () => {
            const ops = executionContext.getOperations();
            for (const op of ops) {
                expect(op).toHaveProperty('initialized', true);
            }
        });
    });
});
