import fse from 'fs-extra';
import { TerafoundationConfig, TestContext } from '@terascope/job-components';
import { DeleteBucketCommand } from '@aws-sdk/client-s3';
import { S3Store } from '../../src/lib/storage/backends/s3_store';
import { TEST_INDEX_PREFIX } from '../test.config';

describe('S3 backend test', () => {
    let s3Backend: S3Store;
    const context = new TestContext(`${TEST_INDEX_PREFIX}s3-store-test`) as any;
    const mockTerafoundation: TerafoundationConfig = {
        connectors: {
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

    describe('->verifyClient', () => {
        beforeEach(async () => {
            s3Backend = new S3Store({
                context,
                terafoundation: mockTerafoundation,
                connection: 'default',
                bucket: 'ts-assets'
            });

            await s3Backend.initialize();
        });

        afterEach(async () => {
            await s3Backend.shutdown();
        });

        it('should throw error trying to verify client if bucket does not exist', async () => {
            const command = new DeleteBucketCommand({
                Bucket: 'ts-assets'
            });
            await s3Backend.api.send(command);

            const response = await s3Backend.verifyClient();
            expect(response).toEqual(false);
        });

        it('should be able to verify the client is up', async () => {
            const response = await s3Backend.verifyClient();
            expect(response).toEqual(true);

            const command = new DeleteBucketCommand({
                Bucket: 'ts-assets'
            });
            await s3Backend.api.send(command);
        });
    });

    describe('save, get, and remove assets', () => {
        beforeAll(async () => {
            s3Backend = new S3Store({
                context,
                terafoundation: mockTerafoundation,
                connection: 'default',
                bucket: 'ts-assets'
            });

            await s3Backend.initialize();
        });

        afterAll(async () => {
            const command = new DeleteBucketCommand({
                Bucket: 'ts-assets'
            });
            await s3Backend.api.send(command);
            await s3Backend.shutdown();
        });

        it('should be able to write in a zip file to ts_assets bucket', async () => {
            const filePath = 'e2e/test/fixtures/assets/example_asset_1.zip';
            await s3Backend.save('ex1', fse.readFileSync(filePath), 30000);
            const result = await s3Backend.list();
            expect(result[0].File).toBe('ex1.zip');
        });

        it('should be able to delete zip file in ts_assets bucket', async () => {
            await s3Backend.remove('ex1');

            const result = await s3Backend.list();
            expect(result).toBeEmpty();
        });

        it('should be able to download asset', async () => {
            const filePath = 'e2e/test/fixtures/assets/example_asset_2.zip';
            await s3Backend.save('ex2', fse.readFileSync(filePath), 30000);

            const result = await s3Backend.get('ex2');

            expect(result).toStartWith('UEsDBAo');
            await s3Backend.remove('ex2');
        });
    });

    describe('when bucket name is not defined', () => {
        let bucketName: string;

        afterAll(async () => {
            const command = new DeleteBucketCommand({
                Bucket: bucketName
            });
            await s3Backend.api.send(command);
            await s3Backend.shutdown();
        });

        it('should create a bucket name containing terafoundation.teraslice.name', async () => {
            bucketName = `ts-assets-${TEST_INDEX_PREFIX}s3-store-test`.replaceAll('_', '-');
            s3Backend = new S3Store({
                context,
                terafoundation: mockTerafoundation,
                connection: 'default',
                bucket: undefined
            });

            await s3Backend.initialize();

            expect(s3Backend.bucket).toBe(bucketName);
        });

        it('should create a bucket name where underscores in teraslice.name are replaced by dashes', async () => {
            const contextWithUnderscoreName = new TestContext('s3_backend_underscores') as any;
            s3Backend = new S3Store({
                context: contextWithUnderscoreName,
                terafoundation: mockTerafoundation,
                connection: 'default',
                bucket: undefined
            });

            await s3Backend.initialize();

            expect(s3Backend.bucket).toBe('ts-assets-s3-backend-underscores');

            bucketName = 'ts-assets-s3-backend-underscores';
        });
    });
});
