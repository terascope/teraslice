import fs from 'node:fs';
import { TestContext, TestContextOptions } from '@terascope/job-components';
import { Logger } from '@terascope/core-utils';
import { createClient } from '@terascope/opensearch-client';
import { createS3Client } from '@terascope/file-asset-apis';
import { AssetsStorage } from '../../src/lib/storage';
import { TEST_INDEX_PREFIX } from '../test.config';

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
                    node: [process.env.SEARCH_TEST_HOST]
                }
            },
            s3: {
                default: {
                    endpoint: process.env.MINIO_HOST,
                    accessKeyId: process.env.MINIO_ACCESS_KEY,
                    secretAccessKey: process.env.MINIO_SECRET_KEY,
                    forcePathStyle: true,
                    sslEnabled: false,
                    region: 'test-region'
                }
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
});
