import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataEntity } from '@terascope/entity-utils';
import {
    OperationLoader, newTestExecutionConfig, TestContext,
    Context, parseName, ParseNameResponse
} from '../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('OperationLoader', () => {
    const context = new TestContext('teraslice-op-loader');
    const asset = 'asset';
    const fixturePath = path.join(dirname, '../dist/test/fixtures');
    const assetTestPath = path.join(fixturePath, asset);

    it('should instantiate', () => {
        const opLoader = new OperationLoader({});

        expect(opLoader).toBeObject();
        expect(opLoader.loadProcessor).toBeDefined();
        expect(opLoader.loadProcessor).toBeFunction();
        expect(opLoader.loadReader).toBeDefined();
        expect(opLoader.loadReader).toBeFunction();
        expect(opLoader.loadAPI).toBeDefined();
        expect(opLoader.loadAPI).toBeFunction();
    });

    it('should load a builtin operation', async () => {
        const opLoader = new OperationLoader({});
        const results = await opLoader.loadProcessor('noop');

        expect(results).toBeDefined();
        expect(results).toBeObject();

        expect(results).toHaveProperty('Processor');
        expect(results).toHaveProperty('Schema');
    });

    it('should load by file path', async () => {
        const opLoader = new OperationLoader({});
        const op = await opLoader.loadProcessor(path.join(assetTestPath, 'example-op'));

        expect(op).toBeDefined();
        expect(op).toBeObject();
        expect(op).toHaveProperty('Processor');
        expect(op).toHaveProperty('Schema');

        const reader = await opLoader.loadReader(path.join(assetTestPath, 'example-reader'));

        expect(reader).toBeDefined();
        expect(reader).toBeObject();
        expect(reader).toHaveProperty('Slicer');
        expect(reader).toHaveProperty('Fetcher');
        expect(reader).toHaveProperty('Schema');
    });

    it('should throw proper errors if op code does not exits', async () => {
        const opLoader = new OperationLoader({});

        await expect(() => opLoader.loadProcessor('someOp')
        ).rejects.toThrow();
    });

    it('should load asset ops', async () => {
        const opLoader = new OperationLoader({ assetPath: fixturePath });

        const results = await opLoader.loadProcessor('example-op', [asset]);

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

        const opLoader = new OperationLoader({ assetPath: fixturePath });

        await expect(() => opLoader.loadProcessor('fail')).rejects.toThrow('Unable to find module for operation: fail');

        const op = await opLoader.loadProcessor('example-op', [asset]);

        expect(op.Processor).not.toBeNil();
        expect(() => {
            new op.Processor(context as Context, opConfig, exConfig);
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
            assetPath: [fixturePath],
        });

        await expect(() => opLoader.loadProcessor('fail')).rejects.toThrow('Unable to find module for operation: fail');

        const op = await opLoader.loadProcessor('example-op', [asset]);

        expect(op.Processor).not.toBeNil();
        expect(() => {
            new op.Processor(context as Context, opConfig, exConfig);
        }).not.toThrow();

        expect(op.Schema).not.toBeNil();
        expect(() => {
            new op.Schema(context).build();
        }).not.toThrow();

        expect(op.API).toBeNil();
    });

    it('should load the new reader', async () => {
        const exConfig = newTestExecutionConfig();
        const opConfig = {
            _op: 'example-reader',
        };

        exConfig.operations.push(opConfig);

        const opLoader = new OperationLoader({
            assetPath: fixturePath
        });

        await expect(() => opLoader.loadReader('fail')).rejects.toThrow('Unable to find module for operation: fail');

        const op = await opLoader.loadReader('example-reader', [asset]);

        expect(op.Slicer).not.toBeNil();
        expect(() => {
            new op.Slicer(context as Context, opConfig, exConfig);
        }).not.toThrow();

        expect(op.Fetcher).not.toBeNil();
        expect(() => {
            new op.Fetcher(context as Context, opConfig, exConfig);
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

    it('should load an api', async () => {
        const exConfig = newTestExecutionConfig();

        const opLoader = new OperationLoader({ assetPath: fixturePath });

        const op = await opLoader.loadAPI('example-api', [asset]);

        expect(op.API).not.toBeNil();
        expect(() => {
            new op.API(context as Context, { _name: 'example-api' }, exConfig);
        }).not.toThrow();
    });

    it('should load an api from a list of assetDirs', async () => {
        const exConfig = newTestExecutionConfig();

        const opLoader = new OperationLoader({
            assetPath: [fixturePath],
        });

        const op = await opLoader.loadAPI('example-api', [asset]);

        expect(op.API).not.toBeNil();
        expect(() => {
            new op.API(context as Context, { _name: 'example-api' }, exConfig);
        }).not.toThrow();
    });

    it('should load an api with a namespace', async () => {
        const exConfig = newTestExecutionConfig();

        const opLoader = new OperationLoader({
            assetPath: fixturePath,
        });

        const op = await opLoader.loadAPI('example-api:hello', [asset]);

        expect(op.API).not.toBeNil();
        expect(() => {
            new op.API(context as Context, { _name: 'example-api' }, exConfig);
        }).not.toThrow();
    });

    it('should load an observer', async () => {
        const exConfig = newTestExecutionConfig();
        const opLoader = new OperationLoader({ assetPath: fixturePath });

        const op = await opLoader.loadAPI('example-observer', [asset]);

        expect(op.API).not.toBeNil();
        expect(() => {
            new op.API(context, { _name: 'example-observer' }, exConfig);
        }).not.toThrow();
    });

    it('should fail if given an api without the required files', async () => {
        const opLoader = new OperationLoader({
            assetPath: fixturePath,
        });

        await expect(() => opLoader.loadAPI('empty-api', [asset])).rejects.toThrow(/requires at least an api\.js or observer\.js/);
    });

    it('should fail if given an api with both an observer and api', async () => {
        const opLoader = new OperationLoader({
            assetPath: fixturePath,
        });

        await expect(() => opLoader.loadAPI('invalid-api-observer', [asset])).rejects.toThrow(/required only one api\.js or observer\.js/);
    });

    it('should fail if fetching a file with a . or _', async () => {
        const opLoader = new OperationLoader({
            assetPath: fixturePath,
        });

        await expect(() => opLoader.loadProcessor('.dot-private-op', [asset])).rejects.toThrow();

        await expect(() => opLoader.loadProcessor('_underscore-private-op', [asset])).rejects.toThrow();
    });

    describe('loading bundled asset', () => {
        const bundleAsset = 'bundled-asset';
        const processor = 'v3_processor';
        const api = 'v3_api';
        const reader = 'v3_reader';

        it('should find processors using new format', async () => {
            const opLoader = new OperationLoader({
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
                assetPath: fixturePath,
            });

            const results = await opLoader.loadAPI('v3_api:test-0', [bundleAsset]);

            expect(results).toHaveProperty('API');
            expect(results).toHaveProperty('Schema');

            expect(results.API).not.toBeNil();
            expect(results.Schema).not.toBeNil();
        });
    });

    describe('namespaced versioned ops', () => {
        const assetHash1 = 'op_asset_v1.0.0';
        const assetHash2 = 'op_asset_v1.4.0';
        const assetHash3 = 'op_asset_v2.0.0';

        const assetPaths = [assetHash1, assetHash2, assetHash3];

        describe('processors', () => {
            let data: DataEntity[];

            const exConfig = newTestExecutionConfig();
            const opConfig = {
                _op: 'op-asset'
            };

            exConfig.operations.push({
                _op: 'test-reader',
            });

            exConfig.operations.push(opConfig);

            beforeEach(() => {
                data = [
                    DataEntity.make({ foo: 'bar' })
                ];
            });
            it('should find processors and using the correct assetHash v2', async () => {
                const opLoader = new OperationLoader({
                    assetPath: fixturePath,
                });

                const op = await opLoader.loadProcessor(`op-asset@${assetHash3}`, assetPaths);

                const processor = new op.Processor(context as Context, opConfig, exConfig);
                const [record] = await processor.handle(data);

                expect(record.version).toEqual('2.0.0');
            });

            it('should find processors and using the correct assetHash v1.4', async () => {
                const opLoader = new OperationLoader({
                    assetPath: fixturePath,
                });

                const op = await opLoader.loadProcessor(`op-asset@${assetHash2}`, assetPaths);

                const processor = new op.Processor(context as Context, opConfig, exConfig);
                const [record] = await processor.handle(data);

                expect(record.version).toEqual('1.4.0');
            });

            it('should find processors and using the correct assetHash', async () => {
                const opLoader = new OperationLoader({
                    assetPath: fixturePath,
                });

                const op = await opLoader.loadProcessor(`op-asset@${assetHash1}`, assetPaths);

                const processor = new op.Processor(context as Context, opConfig, exConfig);
                const [record] = await processor.handle(data);

                expect(record.version).toEqual('1.0.0');
            });
        });

        describe('reader', () => {
            const exConfig = newTestExecutionConfig();

            const opConfig = {
                _op: 'reader-asset'
            };
            exConfig.operations.push(opConfig, { _op: 'noop' });

            it('should find readers and slicers and using the correct assetHash v2', async () => {
                const opLoader = new OperationLoader({
                    assetPath: fixturePath,
                });

                const op = await opLoader.loadReader(`reader-asset@${assetHash3}`, assetPaths);

                const fetcher = new op.Fetcher(context as Context, opConfig, exConfig);
                const slicer = new op.Slicer(context as Context, opConfig, exConfig);

                const [record] = await fetcher.handle();
                // @ts-expect-error
                const slice = await slicer.slice();

                expect(record.version).toEqual('2.0.0');
                expect(slice.version).toEqual('2.0.0');
            });

            it('should find readers and slicers and using the correct assetHash v1.4', async () => {
                const opLoader = new OperationLoader({
                    assetPath: fixturePath,
                });

                const op = await opLoader.loadReader(`reader-asset@${assetHash2}`, assetPaths);

                const fetcher = new op.Fetcher(context as Context, opConfig, exConfig);
                const slicer = new op.Slicer(context as Context, opConfig, exConfig);

                const [record] = await fetcher.handle();
                // @ts-expect-error
                const slice = await slicer.slice();

                expect(record.version).toEqual('1.4.0');
                expect(slice.version).toEqual('1.4.0');
            });

            it('should find readers and slicers and using the correct assetHash', async () => {
                const opLoader = new OperationLoader({
                    assetPath: fixturePath,
                });

                const op = await opLoader.loadReader(`reader-asset@${assetHash1}`, assetPaths);

                const fetcher = new op.Fetcher(context as Context, opConfig, exConfig);
                const slicer = new op.Slicer(context as Context, opConfig, exConfig);

                const [record] = await fetcher.handle();
                // @ts-expect-error
                const slice = await slicer.slice();

                expect(record.version).toEqual('1.0.0');
                expect(slice.version).toEqual('1.0.0');
            });
        });

        describe('api', () => {
            const exConfig = newTestExecutionConfig();

            const apiConfig = {
                _name: 'api-asset'
            };
            exConfig.apis.push(apiConfig);
            exConfig.operations.push({ _op: 'test-reader' }, { _op: 'noop' });

            it('should find apis and using the correct assetHash v2', async () => {
                const opLoader = new OperationLoader({
                    assetPath: fixturePath,
                });

                const op = await opLoader.loadAPI(`api-asset@${assetHash3}`, assetPaths);

                const api = new op.API(context as Context, apiConfig, exConfig);

                // @ts-expect-error
                const { version } = await api.createAPI();

                expect(version).toEqual('2.0.0');
            });

            it('should find apis and using the correct assetHash v1.4', async () => {
                const opLoader = new OperationLoader({
                    assetPath: fixturePath,
                });

                const op = await opLoader.loadAPI(`api-asset@${assetHash2}`, assetPaths);

                const api = new op.API(context as Context, apiConfig, exConfig);

                // @ts-expect-error
                const { version } = await api.createAPI();

                expect(version).toEqual('1.4.0');
            });

            it('should find apis and using the correct assetHash', async () => {
                const opLoader = new OperationLoader({
                    assetPath: fixturePath,
                });

                const op = await opLoader.loadAPI(`api-asset@${assetHash1}`, assetPaths);

                const api = new op.API(context as Context, apiConfig, exConfig);

                // @ts-expect-error
                const { version } = await api.createAPI();

                expect(version).toEqual('1.0.0');
            });

            it('should be able to handle versioning and namespacing', async () => {
                const opLoader = new OperationLoader({
                    assetPath: fixturePath,
                });

                const op = await opLoader.loadAPI(`api-asset@${assetHash3}:foo1`, assetPaths);

                const api = new op.API(context as Context, apiConfig, exConfig);

                // @ts-expect-error
                const { version } = await api.createAPI();

                expect(version).toEqual('2.0.0');
            });
        });

        describe('name collisions', () => {
            describe('processors', () => {
                let data: DataEntity[];

                const exConfig = newTestExecutionConfig();
                const opConfig = {
                    _op: 'op-asset'
                };

                exConfig.operations.push({
                    _op: 'test-reader',
                });

                exConfig.operations.push(opConfig);

                beforeEach(() => {
                    data = [
                        DataEntity.make({ foo: 'bar' })
                    ];
                });

                it('should throw if there are multiple ops with same name and no assetIdentifier', async () => {
                    const opLoader = new OperationLoader({
                        assetPath: fixturePath,
                        validate_name_collisions: true
                    });

                    await expect(opLoader.loadProcessor(`op-asset`, assetPaths)).rejects.toThrow();
                });

                it('should not throw if there are multiple ops with same name and a assetIdentifier', async () => {
                    const opLoader = new OperationLoader({
                        assetPath: fixturePath,
                        validate_name_collisions: true
                    });

                    const op = await opLoader.loadProcessor(`op-asset@${assetHash3}`, assetPaths);

                    const processor = new op.Processor(context as Context, opConfig, exConfig);
                    const [record] = await processor.handle(data);

                    expect(record.version).toEqual('2.0.0');
                });
            });

            describe('readers', () => {
                const exConfig = newTestExecutionConfig();

                const opConfig = {
                    _op: 'reader-asset'
                };
                exConfig.operations.push(opConfig, { _op: 'noop' });

                it('should throw if there are multiple readers with same name and no assetIdentifier', async () => {
                    const opLoader = new OperationLoader({
                        assetPath: fixturePath,
                        validate_name_collisions: true
                    });

                    await expect(opLoader.loadReader('reader-asset', assetPaths)).rejects.toThrow();
                });

                it('should not throw if there are multiple readers with same name and a assetIdentifier', async () => {
                    const opLoader = new OperationLoader({
                        assetPath: fixturePath,
                        validate_name_collisions: true
                    });

                    const op = await opLoader.loadReader(`reader-asset@${assetHash3}`, assetPaths);

                    const fetcher = new op.Fetcher(context as Context, opConfig, exConfig);
                    const slicer = new op.Slicer(context as Context, opConfig, exConfig);

                    const [record] = await fetcher.handle();
                    // @ts-expect-error
                    const slice = await slicer.slice();

                    expect(record.version).toEqual('2.0.0');
                    expect(slice.version).toEqual('2.0.0');
                });
            });

            describe('apis', () => {
                const exConfig = newTestExecutionConfig();

                const apiConfig = {
                    _name: 'api-asset'
                };
                exConfig.apis.push(apiConfig);
                exConfig.operations.push({ _op: 'test-reader' }, { _op: 'noop' });

                it('should throw if there are multiple apis with same name and no assetIdentifier', async () => {
                    const opLoader = new OperationLoader({
                        assetPath: fixturePath,
                        validate_name_collisions: true
                    });

                    await expect(opLoader.loadAPI('api-asset', assetPaths)).rejects.toThrow();
                });

                it('should not throw if there are multiple apis with same name and a assetIdentifier', async () => {
                    const opLoader = new OperationLoader({
                        assetPath: fixturePath,
                        validate_name_collisions: true
                    });

                    const op = await opLoader.loadAPI(`api-asset@${assetHash3}`, assetPaths);

                    const api = new op.API(context as Context, apiConfig, exConfig);

                    // @ts-expect-error
                    const { version } = await api.createAPI();

                    expect(version).toEqual('2.0.0');
                });

                it('should not throw if there are multiple readers with same name and a assetIdentifier with namespacing', async () => {
                    const opLoader = new OperationLoader({
                        assetPath: fixturePath,
                        validate_name_collisions: true
                    });

                    const op = await opLoader.loadAPI(`api-asset@${assetHash3}:foo1`, assetPaths);

                    const api = new op.API(context as Context, apiConfig, exConfig);

                    // @ts-expect-error
                    const { version } = await api.createAPI();

                    expect(version).toEqual('2.0.0');
                });
            });
        });
    });

    describe('parse op and api names', () => {
        const cases: [string, string, boolean, ParseNameResponse][] = [
            [
                'parse base names',
                'op_reader',
                false,
                { name: 'op_reader', assetIdentifier: undefined, tag: undefined }
            ],
            [
                'parse base names with an assetHash',
                'op_reader@bd74534373c5077c50b54d4f1ff2a736b0e8819e',
                false,
                { name: 'op_reader', assetIdentifier: 'bd74534373c5077c50b54d4f1ff2a736b0e8819e', tag: undefined }
            ],
            [
                'parse base names with an assetHash and tag',
                'op_reader@bd74534373c5077c50b54d4f1ff2a736b0e8819e:foobar',
                false,
                { name: 'op_reader', assetIdentifier: 'bd74534373c5077c50b54d4f1ff2a736b0e8819e', tag: 'foobar' }
            ],
            [
                'parse a pre-hashed asset name',
                'op_reader@some_asset',
                false,
                { name: 'op_reader', assetIdentifier: 'some_asset', tag: undefined }
            ],
            [
                'parse a pre-hashed asset name and version',
                'op_reader@some_asset:2.1.0',
                false,
                { name: 'op_reader', assetIdentifier: 'some_asset:2.1.0', tag: undefined }
            ],
            [
                'parse a pre-hashed asset name and version and tag',
                'op_reader@some_asset:2.1.0:barFoo',
                false,
                { name: 'op_reader', assetIdentifier: 'some_asset:2.1.0', tag: 'barFoo' }
            ],
            [
                'parse an api',
                'op_api',
                true,
                { name: 'op_api', assetIdentifier: undefined, tag: undefined }
            ],
            [
                'parse a tagged api',
                'op_api:someTag',
                true,
                { name: 'op_api', assetIdentifier: undefined, tag: 'someTag' }
            ],
            [
                'parse api base names with an assetHash and tag',
                'op_api@bd74534373c5077c50b54d4f1ff2a736b0e8819e:foobar',
                true,
                { name: 'op_api', assetIdentifier: 'bd74534373c5077c50b54d4f1ff2a736b0e8819e', tag: 'foobar' }
            ],
            [
                'parse a pre-hashed asset name of an api',
                'op_api@some_asset',
                true,
                { name: 'op_api', assetIdentifier: 'some_asset', tag: undefined }
            ],
            [
                'parse a pre-hashed asset name and version of an api',
                'op_api@some_asset:2.1.0',
                true,
                { name: 'op_api', assetIdentifier: 'some_asset:2.1.0', tag: undefined }
            ],
            [
                'parse a pre-hashed asset name and tag of an api',
                'op_api@some_asset:myTag',
                true,
                { name: 'op_api', assetIdentifier: 'some_asset', tag: 'myTag' }
            ],
            [
                'parse a pre-hashed asset name, version and tag of an api',
                'op_api@some_asset:2.1.0:someTag',
                true,
                { name: 'op_api', assetIdentifier: 'some_asset:2.1.0', tag: 'someTag' }
            ],
        ];

        test.each(cases)('should %s', (_msg, name, isApi, expectedOutput) => {
            expect(parseName(name, isApi)).toMatchObject(expectedOutput);
        });
    });
});
