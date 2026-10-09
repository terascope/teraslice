import fs from 'node:fs';
import path from 'node:path';
import { jest } from '@jest/globals';
import { TestContext, TestContextOptions } from '@terascope/job-components';
import { Logger } from '@terascope/core-utils';
import { createClient } from '@terascope/opensearch-client';
import { createS3Client } from '@terascope/file-asset-apis';
import { AssetsStorage } from '../../src/lib/storage/index.js';
import { S3_CONNECTOR_CONFIG, SEARCH_TEST_HOST, TEST_INDEX_PREFIX } from '../test.config.js';

function statusError(message: string, statusCode: number) {
    return Object.assign(new Error(message), { statusCode });
}

describe('AssetsStorage using S3 backend', () => {
    let storage: AssetsStorage;
    const options: TestContextOptions = {
        assignment: 'assets_service',
        clients: [
            {
                type: 'elasticsearch-next',
                async createClient(customConfig: Record<string, any>, logger: Logger) {
                    const { client } = await createClient(customConfig, logger);
                    return { client, logger };
                },
                endpoint: 'default'
            },
            {
                type: 's3',
                async createClient(customConfig: Record<string, any>, logger: Logger) {
                    const client = await createS3Client(customConfig, logger);
                    return { client, logger };
                },
                endpoint: 'default'
            }
        ]
    };
    const context = new TestContext(`${TEST_INDEX_PREFIX}assets-storage-test`, options) as any;

    context.sysconfig.terafoundation = {
        connectors: {
            'elasticsearch-next': {
                default: {
                    node: [SEARCH_TEST_HOST]
                }
            },
            s3: {
                default: S3_CONNECTOR_CONFIG
            }
        }
    };
    context.sysconfig.teraslice.asset_storage_connection_type = 's3';
    context.sysconfig.teraslice.asset_storage_connection = 'default';
    context.sysconfig.teraslice.api_response_timeout = 30000;

    beforeAll(async () => {
        storage = new AssetsStorage(context);
        await storage.initialize();
    }, 30000);

    it('will reject an asset that isn\'t in zip format', async () => {
        const filePath = 'e2e/test/fixtures/assets/fake_zip.zip';
        const buffer = fs.readFileSync(filePath);
        await expect(() => storage.save(buffer)).rejects.toThrow('Failed to save asset. File type not recognized as zip.');
    });

    it('will reject an asset if the minimum teraslice version is not met', async () => {
        const filePath = 'e2e/test/fixtures/assets/test_asset_json.zip';
        const buffer = fs.readFileSync(filePath);
        await expect(() => storage.save(buffer)).rejects.toThrow('Asset requires teraslice version 999.9.9 or greater.');
        expect(await storage.grabS3Info()).toEqual([]);
    });

    it('can save an asset to S3', async () => {
        const filePath = 'e2e/test/fixtures/assets/example_asset_1.zip';
        const buffer = fs.readFileSync(filePath);
        const result = await storage.save(buffer);
        expect(result.assetId).toBe('caf0e5ce7cf1edc864f306b1d9edbad0f7060545');
    });

    it('can grab asset info from S3', async () => {
        const list = await storage.grabS3Info();
        expect(list).toEqual([{
            File: 'caf0e5ce7cf1edc864f306b1d9edbad0f7060545.zip',
            Size: 162711
        }]);
    });

    it('can get an asset from S3', async () => {
        /// create a buffer copy of example_asset_1.zip to test if it equals what s3 sends back
        const filePath = 'e2e/test/fixtures/assets/example_asset_1.zip';
        const buffer = fs.readFileSync(filePath);
        const assetRecord = await storage.get('caf0e5ce7cf1edc864f306b1d9edbad0f7060545');
        expect(buffer.equals(assetRecord.blob as Buffer)).toBe(true);
        expect(assetRecord.name).toBe('ex1');
    });

    it('can delete an asset from S3', async () => {
        await storage.remove('caf0e5ce7cf1edc864f306b1d9edbad0f7060545');
        const list = await storage.grabS3Info();
        expect(list).toBeEmpty();
    });

    describe('when removing a partially deleted asset', () => {
        const assetId = 'caf0e5ce7cf1edc864f306b1d9edbad0f7060545';
        const filePath = 'e2e/test/fixtures/assets/example_asset_1.zip';
        let assetDir: string;
        let originalResponseTimeout: number;

        function setResponseTimeout(ms: number) {
            (storage as any).responseTimeout = ms;
        }

        beforeAll(() => {
            assetDir = path.join(storage.assetsPath, assetId);
            originalResponseTimeout = (storage as any).responseTimeout;
        });

        beforeEach(async () => {
            await storage.save(fs.readFileSync(filePath));
        });

        afterEach(async () => {
            jest.restoreAllMocks();
            setResponseTimeout(originalResponseTimeout);
            await storage.remove(assetId).catch(() => {});
        });

        it('removes the S3 object when the ES record is already gone', async () => {
            await (storage as any).esBackend.remove(assetId);

            await storage.remove(assetId);

            expect(await storage.grabS3Info()).toBeEmpty();
        });

        it('removes the asset when only the S3 object remains', async () => {
            await (storage as any).esBackend.remove(assetId);
            fs.rmSync(assetDir, { recursive: true, force: true });

            await storage.remove(assetId);

            expect(await storage.grabS3Info()).toBeEmpty();
        });

        it('removes the asset when only the filesystem copy remains', async () => {
            await (storage as any).esBackend.remove(assetId);
            await (storage as any).s3Backend.remove(assetId);
            expect(fs.existsSync(assetDir)).toBeTrue();

            await storage.remove(assetId);

            expect(fs.existsSync(assetDir)).toBeFalse();
        });

        it('finds the asset in S3 even if the ES check fails', async () => {
            jest.spyOn((storage as any).esBackend, 'get')
                .mockRejectedValueOnce(statusError('ES unavailable', 500));

            await storage.remove(assetId);

            expect(await storage.grabS3Info()).toBeEmpty();
        });

        it('throws the ES error instead of a 404 when no store has the asset', async () => {
            await storage.remove(assetId);
            jest.spyOn((storage as any).esBackend, 'get')
                .mockRejectedValue(statusError('ES unavailable', 500));

            await expect(storage.remove(assetId)).rejects.toMatchObject({
                statusCode: 500,
                message: 'ES unavailable'
            });
        });

        it('throws the S3 error instead of a 404 when no store has the asset', async () => {
            await storage.remove(assetId);
            jest.spyOn((storage as any).s3Backend, 'exists')
                .mockRejectedValue(new Error('S3 unavailable'));

            await expect(storage.remove(assetId)).rejects.toThrow('S3 unavailable');
        });

        it('throws a 504 when the asset still exists after every delete succeeds', async () => {
            setResponseTimeout(1000);
            // resolves without deleting, so the ES record is left behind
            jest.spyOn((storage as any).esBackend, 'remove')
                .mockResolvedValue(undefined);

            await expect(storage.remove(assetId)).rejects.toMatchObject({
                statusCode: 504,
                message: expect.stringContaining(`Asset ${assetId} still exists after delete`)
            });
        });

        it('retries a failed S3 delete and keeps the ES record until it succeeds', async () => {
            const s3Backend = (storage as any).s3Backend;
            const esRemove = jest.spyOn((storage as any).esBackend, 'remove');
            const s3Remove = jest.spyOn(s3Backend, 'remove')
                .mockRejectedValueOnce(new Error('S3 unavailable'));

            await storage.remove(assetId);

            expect(s3Remove).toHaveBeenCalledTimes(2);
            expect(esRemove).toHaveBeenCalledTimes(1);
            expect(await storage.grabS3Info()).toBeEmpty();
        });

        it('throws a 504 at api_response_timeout and leaves the asset retryable', async () => {
            setResponseTimeout(1000);
            jest.spyOn((storage as any).s3Backend, 'remove')
                .mockRejectedValue(new Error('S3 unavailable'));

            await expect(storage.remove(assetId)).rejects.toMatchObject({
                statusCode: 504,
                message: expect.stringContaining(`Timeout deleting asset ${assetId}`)
            });

            // the ES record is kept, so the asset is still listed and found by a retry
            const record = await storage.get(assetId);
            expect(record.name).toBe('ex1');
        });

        it('throws a 404 when the asset is in no store', async () => {
            await storage.remove(assetId);

            await expect(storage.remove(assetId)).rejects.toMatchObject({
                statusCode: 404,
                message: expect.stringContaining(`Unable to find asset ${assetId}`)
            });
        });
    });
});

describe('AssetsStorage using ES backend', () => {
    let storage: AssetsStorage;
    const assetId = 'caf0e5ce7cf1edc864f306b1d9edbad0f7060545';
    const filePath = 'e2e/test/fixtures/assets/example_asset_1.zip';
    const options: TestContextOptions = {
        assignment: 'assets_service',
        clients: [
            {
                type: 'elasticsearch-next',
                async createClient(customConfig: Record<string, any>, logger: Logger) {
                    const { client } = await createClient(customConfig, logger);
                    return { client, logger };
                },
                endpoint: 'default'
            }
        ]
    };
    const context = new TestContext(`${TEST_INDEX_PREFIX}assets-storage-es-test`, options) as any;

    context.sysconfig.terafoundation = {
        connectors: {
            'elasticsearch-next': {
                default: {
                    node: [SEARCH_TEST_HOST]
                }
            }
        }
    };
    context.sysconfig.teraslice.asset_storage_connection_type = 'elasticsearch-next';
    context.sysconfig.teraslice.asset_storage_connection = 'default';
    context.sysconfig.teraslice.api_response_timeout = 30000;

    beforeAll(async () => {
        storage = new AssetsStorage(context);
        await storage.initialize();
    }, 30000);

    it('has no S3 backend', () => {
        expect((storage as any).s3Backend).toBeUndefined();
    });

    it('can save, get and delete an asset', async () => {
        const buffer = fs.readFileSync(filePath);
        const result = await storage.save(buffer);
        expect(result.assetId).toBe(assetId);

        // the ES backend stores and returns the blob as base64
        const assetRecord = await storage.get(assetId);
        expect(assetRecord.blob).toBe(buffer.toString('base64'));

        await storage.remove(assetId);
        await expect(storage.remove(assetId)).rejects.toMatchObject({ statusCode: 404 });
    });

    describe('when removing a partially deleted asset', () => {
        let assetDir: string;

        beforeAll(() => {
            assetDir = path.join(storage.assetsPath, assetId);
        });

        beforeEach(async () => {
            await storage.save(fs.readFileSync(filePath));
        });

        afterEach(async () => {
            jest.restoreAllMocks();
            await storage.remove(assetId).catch(() => {});
        });

        it('removes the asset when only the ES record remains', async () => {
            fs.rmSync(assetDir, { recursive: true, force: true });

            await storage.remove(assetId);

            await expect((storage as any).esBackend.get(assetId))
                .rejects.toMatchObject({ statusCode: 404 });
        });

        it('removes the asset when only the filesystem copy remains', async () => {
            await (storage as any).esBackend.remove(assetId);
            expect(fs.existsSync(assetDir)).toBeTrue();

            await storage.remove(assetId);

            expect(fs.existsSync(assetDir)).toBeFalse();
        });

        it('throws the ES error instead of a 404 when no store has the asset', async () => {
            await storage.remove(assetId);
            jest.spyOn((storage as any).esBackend, 'get')
                .mockRejectedValue(statusError('ES unavailable', 500));

            await expect(storage.remove(assetId)).rejects.toMatchObject({
                statusCode: 500,
                message: 'ES unavailable'
            });
        });

        it('throws a 404 when the asset is in no store', async () => {
            await storage.remove(assetId);

            await expect(storage.remove(assetId)).rejects.toMatchObject({
                statusCode: 404,
                message: expect.stringContaining(`Unable to find asset ${assetId}`)
            });
        });
    });
});
