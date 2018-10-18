import 'jest-extended';
import path from 'path';
import { terasliceOpPath } from './helpers';
import {
    WorkerExecutionContext,
    TestContext,
    newTestExecutionConfig
} from '../src';

describe('WorkerExecutionContext', () => {
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
        const context = new TestContext('worker-execution-context');
        context.sysconfig.teraslice.assets_directory = assetDir;

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
            return executionContext.shutdown();
        });

        it('should have correct properties', () => {
            expect(executionContext).toHaveProperty('config', executionConfig);
            expect(executionContext).toHaveProperty('assetIds', ['fixtures']);
            expect(executionContext).toHaveProperty('context');
        });

        it('should have the registered apis', () => {
            const registry = Object.keys(context.apis.executionContext.registry);
            expect(registry).toEqual([
                'example-reader'
            ]);
        });
    });
});
