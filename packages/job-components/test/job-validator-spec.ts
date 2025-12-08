import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JobValidator, TestContext, JobConfigParams } from '../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('JobValidator', () => {
    const assetHash1 = 'op_asset_v1.0.0';
    const assetHash2 = 'op_asset_v1.4.0';
    const assetHash3 = 'op_asset_v2.0.0';

    const context = new TestContext('teraslice-operations');
    context.sysconfig.teraslice.assets_directory = dirname;

    const api = new JobValidator(context);

    describe('->validateConfig', () => {
        it('returns a completed and valid jobConfig', async () => {
            const jobSpec: JobConfigParams = Object.freeze({
                name: 'noop',
                assets: ['fixtures'],
                autorecover: true,
                apis: [
                    {
                        _name: 'example-api',
                        _dead_letter_action: 'throw'
                    }
                ],
                operations: [
                    {
                        _op: 'test-reader',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            });

            const validJob = await api.validateConfig(jobSpec);
            expect(validJob).toMatchObject(jobSpec);
        });

        it('will throw based off op validation errors', async () => {
        // if subslice_by_key, then it needs type specified or it will error
            const jobSpec: JobConfigParams = {
                name: 'test',
                assets: ['fixtures'],
                operations: [
                    {
                        _op: 'example-reader',
                        example: 123
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };

            await expect(
                () => api.validateConfig(jobSpec)
            ).rejects.toThrow();
        });

        it('throws an error with faulty operation configuration', async () => {
            const jobSpec: JobConfigParams = {
                name: 'test',
                operations: [
                    {
                        something: 'else',
                    } as any,
                    {
                        _op: 'noop',
                    },
                ],
            };

            await expect(
                () => api.validateConfig(jobSpec)
            ).rejects.toThrow();
        });

        it('will properly read an operation', async () => {
            const jobSpec: JobConfigParams = {
                name: 'test',
                assets: ['fixtures'],
                operations: [
                    {
                        _op: 'example-reader',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };

            try {
                const results = await api.validateConfig(jobSpec);
                expect(results).toBeDefined();
            } catch (_err) {
                throw new Error('should not have thrown');
            }
        });

        it('will throw based off opValidation errors', async () => {
            // if subslice_by_key, then it needs type specified or it will error
            const jobSpec: JobConfigParams = {
                name: 'test',
                assets: ['fixtures'],
                operations: [
                    {
                        _op: 'example-reader',
                        example: 123,
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };

            await expect(
                () => api.validateConfig(jobSpec)
            ).rejects.toThrow();
        });

        it('will throw based off crossValidation errors', async () => {
            const jobSpec: JobConfigParams = {
                name: 'test',
                lifecycle: 'persistent',
                assets: ['fixtures'],
                operations: [
                    {
                        _op: 'example-reader',
                    },
                    {
                        _op: 'noop',
                        failCrossValidation: true
                    },
                ],
            };

            await expect(
                () => api.validateConfig(jobSpec)
            ).rejects.toThrow();
        });

        it('can instantiate with an array of asset_paths', async () => {
            const testContext = new TestContext('teraslice-operations');
            testContext.sysconfig.teraslice.assets_directory = [dirname];

            const testApi = new JobValidator(context);

            const jobSpec: JobConfigParams = Object.freeze({
                name: 'noop',
                assets: ['fixtures'],
                autorecover: true,
                apis: [
                    {
                        _name: 'example-api',
                        _dead_letter_action: 'throw'
                    }
                ],
                operations: [
                    {
                        _op: 'test-reader',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            });

            const validJob = await testApi.validateConfig(jobSpec);
            expect(validJob).toMatchObject(jobSpec);
        });

        it('can parse versioned operation names with apis', async () => {
            const testContext = new TestContext('teraslice-operations');

            // TODO: figure out why we have fixtures, and no other test uses testContext
            const newPath = `${dirname}/fixtures`;
            testContext.sysconfig.teraslice.assets_directory = [newPath];

            const testApi = new JobValidator(testContext);

            const jobSpec: JobConfigParams = Object.freeze({
                name: 'myJob',
                assets: [assetHash1, assetHash2, assetHash3],
                autorecover: true,
                apis: [
                    { _name: `api-asset@${assetHash2}`, version: '1.4.0' }
                ],
                operations: [
                    {
                        _op: `reader-asset@${assetHash2}`,
                        api_name: `api-asset@${assetHash2}`,
                        version: '1.4.0'
                    },
                    {
                        _op: 'noop',
                    },
                ],
            });

            const validJob = await testApi.validateConfig(jobSpec);

            expect(validJob).toMatchObject(jobSpec);
        });
    });

    describe('->hasSchema', () => {
        it('checks _ops to make sure they provide a schema, formatted correctly', () => {
            const opCode = { newProcessor: () => null, schema: () => ({}) };
            const badCode1 = { newProcessor: () => null, schema: () => 'retuning a string' };
            const badCode2 = { newProcessor: () => null, schema: 3 };
            const badCode3 = { newProcessor: () => null };

            expect(() => {
                api.hasSchema(opCode, 'test');
            }).not.toThrow();
            expect(() => {
                api.hasSchema(badCode1, 'test');
            }).toThrow('test schema needs to return an object');
            expect(() => {
                api.hasSchema(badCode2, 'test');
            }).toThrow('test needs to have a method named "schema"');
            expect(() => {
                api.hasSchema(badCode3, 'test');
            }).toThrow('test needs to have a method named "schema"');
        });
    });
});
