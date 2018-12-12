import 'jest-extended'; // require for type definitions
import { createTempDirSync } from 'jest-fixtures';
import fse from 'fs-extra';
import path from 'path';
import {
    OperationLoader,
    LegacyProcessor,
    LegacyReader,
    newTestExecutionConfig,
    debugLogger,
    TestContext,
    WorkerContext,
} from '../src';

describe('OperationLoader', () => {
    const logger = debugLogger('operation-loader');
    const assetId = '1234';
    const tmpDir = createTempDirSync();
    const assetPath = path.join(tmpDir, assetId);
    const terasliceOpPath = path.join(__dirname, '../../teraslice/lib');
    const processorPath = path.join(__dirname, '..', 'examples', 'asset', 'example-filter-op');
    const context = new TestContext('teraslice-op-loader');

    beforeAll(async () => {
        await fse.copy(processorPath, path.join(assetPath, 'example-filter-op'));
    });

    it('can instantiate', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });

        expect(opLoader).toBeObject();
        expect(opLoader.load).toBeDefined();
        expect(opLoader.load).toBeFunction();
    });

    it('can load an operation', async () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });
        const results = opLoader.load('noop') as LegacyProcessor;

        expect(results).toBeDefined();
        expect(results).toBeObject();
        expect(results.newProcessor).toBeDefined();
        expect(results.schema).toBeDefined();
        expect(results.newProcessor).toBeFunction();
        expect(results.schema).toBeFunction();

        const opSchema = results.schema();
        expect(opSchema).toBeDefined();
        expect(opSchema).toBeObject();

        const exConfig = newTestExecutionConfig();
        const processor = await results.newProcessor(context, { _op: 'noop' }, exConfig);

        expect(processor).toBeDefined();
        expect(processor).toBeFunction();

        const someData = [{ key: 'someData' }];
        const processorResults = await processor(someData, logger, {});
        expect(processorResults).toEqual(someData);
    });

    it('can load by file path', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });
        const op = opLoader.load(path.join(__dirname, 'fixtures', 'test-op')) as LegacyProcessor;

        expect(op).toBeDefined();
        expect(op).toBeObject();
        expect(op.newProcessor).toBeDefined();
        expect(op.schema).toBeDefined();
        expect(op.newProcessor).toBeFunction();
        expect(op.schema).toBeFunction();

        const reader = opLoader.load(path.join(__dirname, 'fixtures', 'test-reader')) as LegacyReader;

        expect(reader).toBeDefined();
        expect(reader).toBeObject();
        expect(reader.newReader).toBeDefined();
        expect(reader.schema).toBeDefined();
        expect(reader.newReader).toBeFunction();
        expect(reader.schema).toBeFunction();
    });

    it('can throw proper errors if op code does not exits', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });

        expect(() => {
            opLoader.load('someOp');
        }).toThrowError();
    });

    it('can load asset ops', async () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: tmpDir,
        });

        const results = opLoader.load('example-filter-op', [assetId]) as LegacyProcessor;

        expect(results).toBeDefined();
        expect(results).toBeObject();
        expect(results.newProcessor).toBeDefined();
        expect(results.schema).toBeDefined();
        expect(results.newProcessor).toBeFunction();
        expect(results.schema).toBeFunction();

        const opSchema = results.schema();
        expect(opSchema).toBeDefined();
        expect(opSchema).toBeObject();

        const exConfig = newTestExecutionConfig();
        const processor = await results.newProcessor(context, { _op: 'hello' }, exConfig);

        expect(processor).toBeDefined();
        expect(processor).toBeFunction();

        const someData =  [{ key: 'someData' }];
        const processorResults = await processor(someData, logger, {});
        expect(processorResults).toEqual([]);
    });

    it('can load the new processor', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-op'
        };

        exConfig.operations.push({
            _op: 'example-reader'
        });
        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: path.join(__dirname),
        });

        expect(() => {
            opLoader.loadProcessor('fail');
        }).toThrowError('Unable to find module for operation: fail');

        const op = opLoader.loadProcessor('example-op', ['fixtures']);

        expect(op.Processor).not.toBeNil();
        expect(() => {
            new op.Processor(context as WorkerContext, opConfig, exConfig);
        }).not.toThrow();

        expect(op.Schema).not.toBeNil();
        expect(() => {
            new op.Schema(context).build();
        }).not.toThrow();

        expect(op.API).toBeNil();
    });

    it('can load a shimmed processor', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-op'
        };

        exConfig.operations.push({
            _op: 'example-reader'
        });
        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: path.join(__dirname),
        });

        const op = opLoader.loadProcessor('test-op', ['fixtures']);

        expect(op.Processor).not.toBeNil();
        expect(() => {
            new op.Processor(context as WorkerContext, opConfig, exConfig);
        }).not.toThrow();

        expect(op.Schema).not.toBeNil();
        expect(() => {
            new op.Schema(context).build();
        }).not.toThrow();

        expect(op.API).toBeNil();
    });

    it('can load the new reader', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-reader'
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: path.join(__dirname),
        });

        expect(() => {
            opLoader.loadReader('fail');
        }).toThrowError('Unable to find module for operation: fail');

        const op = opLoader.loadReader('example-reader', ['fixtures']);

        expect(op.Slicer).not.toBeNil();
        expect(() => {
            new op.Slicer(context as WorkerContext, opConfig, exConfig);
        }).not.toThrow();

        expect(op.Fetcher).not.toBeNil();
        expect(() => {
            new op.Fetcher(context as WorkerContext, opConfig, exConfig);
        }).not.toThrow();

        expect(op.Schema).not.toBeNil();
        expect(() => {
            new op.Schema(context).build();
        }).not.toThrow();

        expect(op.API).not.toBeNil();
        expect(() => {
            // @ts-ignore
            new op.API(context, { _name: 'test' }, exConfig);
        }).not.toThrow();
    });

    it('can load a shimmed reader', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'test-reader'
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: path.join(__dirname),
        });

        const op = opLoader.loadReader('test-reader', ['fixtures']);

        expect(op.Slicer).not.toBeNil();
        expect(() => {
            new op.Slicer(context as WorkerContext, opConfig, exConfig);
        }).not.toThrow();

        expect(op.Fetcher).not.toBeNil();
        expect(() => {
            new op.Fetcher(context as WorkerContext, opConfig, exConfig);
        }).not.toThrow();

        expect(op.Schema).not.toBeNil();
        expect(() => {
            new op.Schema(context).build();
        }).not.toThrow();

        expect(op.API).toBeNil();
    });

    it('can load an api', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'test-reader'
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: path.join(__dirname),
        });

        const op = opLoader.loadAPI('example-api', [
            'fixtures'
        ]);

        expect(op.API).not.toBeNil();
        expect(() => {
            // @ts-ignore
            new op.API(context as WorkerContext, { _name: 'example-api' }, exConfig);
        }).not.toThrow();
    });

    it('can load an observer', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'test-reader'
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: path.join(__dirname),
        });

        const op = opLoader.loadAPI('example-observer', [
            'fixtures'
        ]);

        expect(op.Observer).not.toBeNil();
        expect(() => {
            // @ts-ignore
            new op.Observer(context, { _name: 'example-observer' }, exConfig);
        }).not.toThrow();
    });
});
