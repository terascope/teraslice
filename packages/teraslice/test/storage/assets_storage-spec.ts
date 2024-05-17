import fs from 'fs';
import { TestContext, TestContextOptions } from '@terascope/job-components';
import { Logger } from '@terascope/utils';
import { createClient } from 'elasticsearch-store';
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
                createClient,
                endpoint: 'default'
            },
            {
                type: 's3',
                createClient: async (customConfig: Record<string, any>, logger: Logger) => {
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

    it('can save an asset to S3', async () => {
        const filePath = 'e2e/test/fixtures/assets/example_asset_1.zip';
        const buffer = fs.readFileSync(filePath);
        const result = await storage.save(buffer);
        expect(result.assetId).toBe('2909ec5fd38466cf6276cc14ede25096f1f34ee9');
    });

    it('can grab asset info from S3', async () => {
        const list = await storage.grabS3Info();
        expect(list).toEqual([{
            File: '2909ec5fd38466cf6276cc14ede25096f1f34ee9.zip',
            Size: 2759
        }]);
    });

    it('can get an asset from S3', async () => {
        /// create a buffer copy of example_asset_1.zip to test if it equals what s3 sends back
        const filePath = 'e2e/test/fixtures/assets/example_asset_1.zip';
        const buffer = fs.readFileSync(filePath);
        const assetRecord = await storage.get('2909ec5fd38466cf6276cc14ede25096f1f34ee9');
        expect(buffer.equals(assetRecord.blob as Buffer)).toBe(true);
        expect(assetRecord.name).toBe('ex1');
    });

    it('can delete an asset from S3', async () => {
        await storage.remove('2909ec5fd38466cf6276cc14ede25096f1f34ee9');
        const list = await storage.grabS3Info();
        expect(list).toBeEmpty();
    });
});
