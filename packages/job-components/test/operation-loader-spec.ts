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
    WorkerContext
} from '../src';

describe('OperationLoader', () => {
    const logger = debugLogger('operation-loader');
    const assetId = '1234';
    const tmpDir = createTempDirSync();
    const assetPath = path.join(tmpDir, assetId);
    const terasliceOpPath = path.join(__dirname, '../../teraslice/lib');
    const processorPath = path.join(__dirname, '..', 'examples', 'asset', 'example-filter-op');
    const context = new TestContext('teraslice-op-loader');
    const v2AssetName = 'asset-v2';
    const fixturePath = path.join(__dirname, 'fixtures');
    const v2AssetPath = path.join(fixturePath, v2AssetName);

    beforeAll(async () => {
        await fse.copySync(processorPath, path.join(assetPath, 'example-filter-op'));
    });

    it('should instantiate', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });

        expect(opLoader).toBeObject();
        expect(opLoader.load).toBeDefined();
        expect(opLoader.load).toBeFunction();
    });

    it('should load an operation', async () => {
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

    it('should load by file path', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });
        const op = opLoader.load(path.join(v2AssetPath, 'test-op')) as LegacyProcessor;

        expect(op).toBeDefined();
        expect(op).toBeObject();
        expect(op.newProcessor).toBeDefined();
        expect(op.schema).toBeDefined();
        expect(op.newProcessor).toBeFunction();
        expect(op.schema).toBeFunction();

        const reader = opLoader.load(path.join(v2AssetPath, 'test-reader')) as LegacyReader;

        expect(reader).toBeDefined();
        expect(reader).toBeObject();
        expect(reader.newReader).toBeDefined();
        expect(reader.schema).toBeDefined();
        expect(reader.newReader).toBeFunction();
        expect(reader.schema).toBeFunction();
    });

    it('should throw proper errors if op code does not exits', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });

        expect(() => {
            opLoader.load('someOp');
        }).toThrowError();
    });

    it('should load asset ops', async () => {
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

        const someData = [{ key: 'someData' }];
        const processorResults = await processor(someData, logger, {});
        expect(processorResults).toEqual([]);
    });

    it('should load the new processor', () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-op',
        };

        exConfig.operations.push({
            _op: 'example-reader',
        });
        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        expect(() => {
            opLoader.loadProcessor('fail');
        }).toThrowError('Unable to find module for operation: fail');

        const op = opLoader.loadProcessor('example-op', [v2AssetName]);

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

    it('should load the new processor from a list of assetDirs', () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-op',
        };

        exConfig.operations.push({
            _op: 'example-reader',
        });
        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: [tmpDir, fixturePath],
        });

        expect(() => {
            opLoader.loadProcessor('fail');
        }).toThrowError('Unable to find module for operation: fail');

        const op = opLoader.loadProcessor('example-op', [v2AssetName]);

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

    it('should load a shimmed processor', () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-op',
        };

        exConfig.operations.push({
            _op: 'example-reader',
        });
        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        const op = opLoader.loadProcessor('test-op', [v2AssetName]);

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

    fit('should load the new reader', () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-reader',
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath
        });

        expect(() => {
            opLoader.loadReader('fail');
        }).toThrowError('Unable to find module for operation: fail');

        const op = opLoader.loadReader('example-reader', [v2AssetName]);
         console.log({ op , terasliceOpPath})
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
            // @ts-expect-error
            new op.API(context, { _name: 'test' }, exConfig);
        }).not.toThrow();
    });

    it('should load a shimmed reader', () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'test-reader',
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        const op = opLoader.loadReader('test-reader', [v2AssetName]);

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

    it('should load an api', () => {
        const exConfig = newTestExecutionConfig();

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        const op = opLoader.loadAPI('example-api', [v2AssetName]);

        expect(op.API).not.toBeNil();
        expect(() => {
            new op.API(context as WorkerContext, { _name: 'example-api' }, exConfig);
        }).not.toThrow();
    });

    it('should load an api from a list of assetDirs', () => {
        const exConfig = newTestExecutionConfig();

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: [tmpDir, fixturePath],
        });

        const op = opLoader.loadAPI('example-api', [v2AssetName]);

        expect(op.API).not.toBeNil();
        expect(() => {
            new op.API(context as WorkerContext, { _name: 'example-api' }, exConfig);
        }).not.toThrow();
    });

    it('should load an api with a namespace', () => {
        const exConfig = newTestExecutionConfig();

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        const op = opLoader.loadAPI('example-api:hello', [v2AssetName]);

        expect(op.API).not.toBeNil();
        expect(() => {
            new op.API(context as WorkerContext, { _name: 'example-api' }, exConfig);
        }).not.toThrow();
    });

    it('should load an observer', () => {
        const exConfig = newTestExecutionConfig();
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        const op = opLoader.loadAPI('example-observer', [v2AssetName]);

        expect(op.API).not.toBeNil();
        expect(() => {
            // @ts-expect-error
            new op.API(context, { _name: 'example-observer' }, exConfig);
        }).not.toThrow();
    });

    it('should fail if given an api without the required files', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        expect(() => {
            opLoader.loadAPI('empty-api', [v2AssetName]);
        }).toThrowError(/requires at least an api\.js or observer\.js/);
    });

    it('should fail if given an api with both an observer and api', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        expect(() => {
            opLoader.loadAPI('invalid-api-observer', [v2AssetName]);
        }).toThrowError(/required only one api\.js or observer\.js/);
    });

    it('should fail if fetching a file with a . or _', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        expect(() => {
            opLoader.loadProcessor('.dot-private-op', [v2AssetName]);
        }).toThrowError();

        expect(() => {
            opLoader.loadProcessor('_underscore-private-op', [v2AssetName]);
        }).toThrowError();
    });

    describe('loading v3 asset', () => {
        const v3AssetName = 'asset-v3';
        const processor = 'v3_processor';
        const api = 'v3_api';
        const reader = 'v3_reader';

        it('should find processors using new format', () => {
            const opLoader = new OperationLoader({
                terasliceOpPath,
                assetPath: fixturePath,
            });

            const results = opLoader.loadProcessor(processor, [v3AssetName]);

            expect(results).toHaveProperty('Processor');
            expect(results).toHaveProperty('Schema');

            expect(results.Processor).not.toBeNil();
            expect(results.Schema).not.toBeNil();
        });

        it('should find readers using new format', () => {
            const opLoader = new OperationLoader({
                terasliceOpPath,
                assetPath: fixturePath,
            });

            const results = opLoader.loadReader(reader, [v3AssetName]);

            expect(results).toHaveProperty('Slicer');
            expect(results).toHaveProperty('Fetcher');
            expect(results).toHaveProperty('Schema');

            expect(results.Slicer).not.toBeNil();
            expect(results.Fetcher).not.toBeNil();
            expect(results.Schema).not.toBeNil();
        });

        it('should find apis using new format', () => {
            const opLoader = new OperationLoader({
                terasliceOpPath,
                assetPath: fixturePath,
            });

            const results = opLoader.loadAPI(api, [v3AssetName]);

            expect(results).toHaveProperty('API');
            expect(results).toHaveProperty('Schema');

            expect(results.API).not.toBeNil();
            expect(results.Schema).not.toBeNil();
        });
    });
});
