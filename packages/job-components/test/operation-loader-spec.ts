import 'jest-extended'; // require for type definitions
import { createTempDirSync } from 'jest-fixtures';
import fse from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    OperationLoader,
    newTestExecutionConfig,
    TestContext,
    WorkerContext
} from '../src';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('OperationLoader', () => {
    const assetId = '1234';
    const tmpDir = createTempDirSync();
    const assetPath = path.join(tmpDir, assetId);
    const terasliceOpPath = path.join(dirname, '../../teraslice/lib');
    const processorPath = path.join(dirname, '..', 'examples', 'asset', 'example-filter-op');
    const context = new TestContext('teraslice-op-loader');
    const asset = 'asset';
    const fixturePath = path.join(dirname, 'fixtures');
    const assetTestPath = path.join(fixturePath, asset);

    beforeAll(async () => {
        await fse.copySync(processorPath, path.join(assetPath, 'example-filter-op'));
    });

    it('should instantiate', () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });

        expect(opLoader).toBeObject();
        expect(opLoader.loadProcessor).toBeDefined();
        expect(opLoader.loadProcessor).toBeFunction();
        expect(opLoader.loadReader).toBeDefined();
        expect(opLoader.loadReader).toBeFunction();
        expect(opLoader.loadAPI).toBeDefined();
        expect(opLoader.loadAPI).toBeFunction();
    });

    it('should load an operation', async () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });
        const results = await opLoader.loadProcessor('noop');

        expect(results).toBeDefined();
        expect(results).toBeObject();

        expect(results).toHaveProperty('Processor');
        expect(results).toHaveProperty('Schema');
    });

    it('should load by file path', async () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });
        const op = await opLoader.loadProcessor(path.join(assetTestPath, 'test-op'));

        expect(op).toBeDefined();
        expect(op).toBeObject();
        expect(op).toHaveProperty('Processor');
        expect(op).toHaveProperty('Schema');

        const reader = await opLoader.loadReader(path.join(assetTestPath, 'test-reader'));

        expect(reader).toBeDefined();
        expect(reader).toBeObject();
        expect(reader).toHaveProperty('Slicer');
        expect(reader).toHaveProperty('Fetcher');
        expect(reader).toHaveProperty('Schema');
    });

    it('should throw proper errors if op code does not exits', async () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
        });

        await expect(() => opLoader.loadProcessor('someOp')
        ).rejects.toThrow();
    });

    it('should load asset ops', async () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: tmpDir,
        });

        const results = await opLoader.loadProcessor('example-filter-op', [assetId]);

        expect(results).toBeDefined();
        expect(results).toBeObject();
        expect(results).toHaveProperty('Processor');
        expect(results).toHaveProperty('Schema');
    });

    it('should load the new processor', async () => {
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

        await expect(() => opLoader.loadProcessor('fail')).rejects.toThrowError('Unable to find module for operation: fail');

        const op = await opLoader.loadProcessor('example-op', [asset]);

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

    it('should load the new processor from a list of assetDirs', async () => {
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

        await expect(() => opLoader.loadProcessor('fail')).rejects.toThrowError('Unable to find module for operation: fail');

        const op = await opLoader.loadProcessor('example-op', [asset]);

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

    it('should load a shimmed processor', async () => {
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

        const op = await opLoader.loadProcessor('test-op', [asset]);

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

    it('should load an legacy reader', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-reader',
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath
        });

        const op = await opLoader.loadReader('legacy-reader', [asset]);

        expect(op).toHaveProperty('Slicer');
        expect(op).toHaveProperty('Fetcher');
        expect(op).toHaveProperty('Schema');
    });

    it('should load an legacy processor', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-reader',
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath
        });

        const op = await opLoader.loadProcessor('legacy-op', [asset]);

        expect(op).toHaveProperty('Processor');
        expect(op).toHaveProperty('Schema');
    });

    it('should load the new reader', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-reader',
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath
        });

        await expect(() => opLoader.loadReader('fail')).rejects.toThrowError('Unable to find module for operation: fail');

        const op = await opLoader.loadReader('example-reader', [asset]);

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

    it('should load a shimmed reader', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'test-reader',
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        const op = await opLoader.loadReader('test-reader', [asset]);

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

    it('should load an api', async () => {
        const exConfig = newTestExecutionConfig();

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        const op = await opLoader.loadAPI('example-api', [asset]);

        expect(op.API).not.toBeNil();
        expect(() => {
            new op.API(context as WorkerContext, { _name: 'example-api' }, exConfig);
        }).not.toThrow();
    });

    it('should load an api from a list of assetDirs', async () => {
        const exConfig = newTestExecutionConfig();

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: [tmpDir, fixturePath],
        });

        const op = await opLoader.loadAPI('example-api', [asset]);

        expect(op.API).not.toBeNil();
        expect(() => {
            new op.API(context as WorkerContext, { _name: 'example-api' }, exConfig);
        }).not.toThrow();
    });

    it('should load an api with a namespace', async () => {
        const exConfig = newTestExecutionConfig();

        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        const op = await opLoader.loadAPI('example-api:hello', [asset]);

        expect(op.API).not.toBeNil();
        expect(() => {
            new op.API(context as WorkerContext, { _name: 'example-api' }, exConfig);
        }).not.toThrow();
    });

    it('should load an observer', async () => {
        const exConfig = newTestExecutionConfig();
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        const op = await opLoader.loadAPI('example-observer', [asset]);

        expect(op.API).not.toBeNil();
        expect(() => {
            // @ts-expect-error
            new op.API(context, { _name: 'example-observer' }, exConfig);
        }).not.toThrow();
    });

    it('should fail if given an api without the required files', async () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        await expect(() => opLoader.loadAPI('empty-api', [asset])).rejects.toThrowError(/requires at least an api\.js or observer\.js/);
    });

    it('should fail if given an api with both an observer and api', async () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        await expect(() => opLoader.loadAPI('invalid-api-observer', [asset])).rejects.toThrowError(/required only one api\.js or observer\.js/);
    });

    it('should fail if fetching a file with a . or _', async () => {
        const opLoader = new OperationLoader({
            terasliceOpPath,
            assetPath: fixturePath,
        });

        await expect(() => opLoader.loadProcessor('.dot-private-op', [asset])).rejects.toThrowError();

        await expect(() => opLoader.loadProcessor('_underscore-private-op', [asset])).rejects.toThrowError();
    });

    describe('loading bundled asset', () => {
        const bundleAsset = 'bundled-asset';
        const processor = 'v3_processor';
        const api = 'v3_api';
        const reader = 'v3_reader';

        it('should find processors using new format', async () => {
            const opLoader = new OperationLoader({
                terasliceOpPath,
                assetPath: fixturePath,
            });

            const results = await opLoader.loadProcessor(processor, [bundleAsset]);

            expect(results).toHaveProperty('Processor');
            expect(results).toHaveProperty('Schema');

            expect(results.Processor).not.toBeNil();
            expect(results.Schema).not.toBeNil();
        });

        it('should find readers using new format', async () => {
            const opLoader = new OperationLoader({
                terasliceOpPath,
                assetPath: fixturePath,
            });

            const results = await opLoader.loadReader(reader, [bundleAsset]);

            expect(results).toHaveProperty('Slicer');
            expect(results).toHaveProperty('Fetcher');
            expect(results).toHaveProperty('Schema');

            expect(results.Slicer).not.toBeNil();
            expect(results.Fetcher).not.toBeNil();
            expect(results.Schema).not.toBeNil();
        });

        it('should find apis using new format', async () => {
            const opLoader = new OperationLoader({
                terasliceOpPath,
                assetPath: fixturePath,
            });

            const results = await opLoader.loadAPI(api, [bundleAsset]);

            expect(results).toHaveProperty('API');
            expect(results).toHaveProperty('Schema');

            expect(results.API).not.toBeNil();
            expect(results.Schema).not.toBeNil();
        });

        it('should find namespaced apis using new format', async () => {
            const opLoader = new OperationLoader({
                terasliceOpPath,
                assetPath: fixturePath,
            });

            const results = await opLoader.loadAPI('v3_api:test-0', [bundleAsset]);

            expect(results).toHaveProperty('API');
            expect(results).toHaveProperty('Schema');

            expect(results.API).not.toBeNil();
            expect(results.Schema).not.toBeNil();
        });
    });
});
