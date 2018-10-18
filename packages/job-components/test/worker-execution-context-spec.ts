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

        it('should have correct properties', () => {
            expect(executionContext).toHaveProperty('config', executionConfig);
            expect(executionContext).toHaveProperty('assetIds', ['fixtures']);
            expect(executionContext).toHaveProperty('context');
        });

        it('should not be able to load twice', () => {
            executionContext.load();

            expect(() => {
                executionContext.load();
            }).toThrowError();
        });
    });

    describe('when loaded', () => {
        const inputContext = new TestContext('worker-execution-context');
        inputContext.sysconfig.teraslice.assets_directory = assetDir;

        const executionContext = new WorkerExecutionContext({
            context: inputContext,
            executionConfig,
            assetIds,
            terasliceOpPath,
        });

        const { context } = executionContext;

        executionContext.load();

        it('should have the registered apis', () => {
            const registry = Object.keys(context.apis.executionContext.registry);
            expect(registry).toEqual([
                'example-reader'
            ]);
        });
    });
});
