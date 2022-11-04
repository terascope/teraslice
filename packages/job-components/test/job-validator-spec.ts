import 'jest-extended'; // require for type definitions
import * as path from 'path';
import { fileURLToPath } from 'url';
import { JobValidator, TestContext, JobConfig } from '../src/index.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

describe('JobValidator', () => {
    const context = new TestContext('teraslice-operations');
    context.sysconfig.teraslice.assets_directory = dirPath;

    const terasliceOpPath = path.join(dirPath, '../../teraslice/lib');
    const api = new JobValidator(context, {
        terasliceOpPath,
    });

    describe('->validateConfig', () => {
        it('returns a completed and valid jobConfig', async () => {
            const jobSpec: JobConfig = Object.freeze({
                name: 'noop',
                assets: ['fixtures'],
                autorecover: true,
                apis: [
                    {
                        _name: 'example-api',
                        _encoding: undefined,
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
            const jobSpec: JobConfig = {
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

            await expect(() => {
                return api.validateConfig(jobSpec);
            }).rejects
        });

        it('throws an error with faulty operation configuration', async () => {
            const jobSpec: JobConfig = {
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

            await expect(() => {
                return api.validateConfig(jobSpec);
            }).rejects
        });

        it('will properly read an operation', async () => {
            const jobSpec: JobConfig = {
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

            await expect(() => {
                return api.validateConfig(jobSpec);
            }).resolves
        });

        it('will throw based off opValition errors', async () => {
            // if subslice_by_key, then it needs type specified or it will error
            const jobSpec: JobConfig = {
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

            await expect(() => {
                return api.validateConfig(jobSpec);
            }).rejects
        });

        it('will throw based off crossValidation errors', async () => {
            const jobSpec: JobConfig = {
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

            await expect(() => {
                return api.validateConfig(jobSpec);
            }).rejects
        });

        it('can instantiate with an array of asset_paths', async () => {
            const testContext = new TestContext('teraslice-operations');
            testContext.sysconfig.teraslice.assets_directory = [dirPath];

            const testApi = new JobValidator(context, {
                terasliceOpPath,
            });

            const jobSpec: JobConfig = Object.freeze({
                name: 'noop',
                assets: ['fixtures'],
                autorecover: true,
                apis: [
                    {
                        _name: 'example-api',
                        _encoding: undefined,
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
    });

    describe('->hasSchema', () => {
        it('checks _ops to make sure they provide a schema, formatted correctly', () => {
            const opCode = { newProcessor: () => null, schema: () => ({}) };
            const badCode1 = { newProcessor: () => null, schema: () => 'retuning a string' };
            const badCode2 = { newProcessor: () => null, schema: 3 };
            const badCode3 = { newProcessor: () => null };

            expect(() => {
                api.hasSchema(opCode, 'test');
            }).not.toThrowError();
            expect(() => {
                api.hasSchema(badCode1, 'test');
            }).toThrowError('test schema needs to return an object');
            expect(() => {
                api.hasSchema(badCode2, 'test');
            }).toThrowError('test needs to have a method named "schema"');
            expect(() => {
                api.hasSchema(badCode3, 'test');
            }).toThrowError('test needs to have a method named "schema"');
        });
    });
});
