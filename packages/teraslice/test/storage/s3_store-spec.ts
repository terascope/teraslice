import fse from 'fs-extra';
import { Logger } from '@terascope/utils';
import { TestContext, TestContextOptions } from '@terascope/job-components';
import { createS3Client, deleteS3Bucket } from '@terascope/file-asset-apis';
import { S3Store } from '../../src/lib/storage/backends/s3_store';
import { TEST_INDEX_PREFIX } from '../test.config';

describe('S3 backend test', () => {
    let s3Backend: S3Store;
    const contextOptions: TestContextOptions = {
        // assignment: 'assets_service',
        clients: [
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
    const context = new TestContext(`${TEST_INDEX_PREFIX}s3-store-test`, contextOptions) as any;
    context.sysconfig.terafoundation = {
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
    // describe('->S3Store', () => {
    //     it('should throw when given an invalid bucket name', async () => {
    //         s3Backend = new S3Store({
    //             context,
    //             terafoundation: context.sysconfig.terafoundation,
    //             connection: 'default',
    //             bucket: 'Invalid-Bucket-Name@'
    //         });

    //         await expect(s3Backend.initialize()).rejects.toThrow('Bucket name does not follow S3 naming rules: The specified bucket is not valid.');
    //     });
    // });

    describe('->verifyClient', () => {
        beforeEach(async () => {
            s3Backend = new S3Store({
                context,
                terafoundation: context.sysconfig.terafoundation,
                connection: 'default',
                bucket: 'ts-assets'
            });

            await s3Backend.initialize();
        });

        afterEach(async () => {
            await s3Backend.shutdown();
        });

        it('should throw error trying to verify client if bucket does not exist', async () => {
            const command = {
                Bucket: 'ts-assets'
            };
            await deleteS3Bucket(s3Backend.api, command);

            const response = await s3Backend.verifyClient();
            expect(response).toEqual(false);
        });

        it('should be able to verify the client is up', async () => {
            const response = await s3Backend.verifyClient();
            expect(response).toEqual(true);

            const command = {
                Bucket: 'ts-assets'
            };
            await deleteS3Bucket(s3Backend.api, command);
        });
    });

    describe('save, get, and remove assets', () => {
        beforeAll(async () => {
            s3Backend = new S3Store({
                context,
                terafoundation: context.sysconfig.terafoundation,
                connection: 'default',
                bucket: 'ts-assets'
            });

            await s3Backend.initialize();
        });

        afterAll(async () => {
            const command = {
                Bucket: 'ts-assets'
            };
            await deleteS3Bucket(s3Backend.api, command);
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
            const filePath = 'e2e/test/fixtures/assets/example_asset_1.zip';
            const fileBuffer = fse.readFileSync(filePath);
            await s3Backend.save('ex1', fileBuffer, 30000);

            const result = await s3Backend.get('ex1');

            expect(result.equals(fileBuffer)).toBe(true);
            await s3Backend.remove('ex1');
        });
    });

    describe('when bucket name is not defined', () => {
        let bucketName: string;

        afterAll(async () => {
            const command = {
                Bucket: bucketName
            };
            await deleteS3Bucket(s3Backend.api, command);
            await s3Backend.shutdown();
        });

        it('should create a bucket name containing terafoundation.teraslice.name', async () => {
            bucketName = `ts-assets-${TEST_INDEX_PREFIX}s3-store-test`.replaceAll('_', '-');
            s3Backend = new S3Store({
                context,
                terafoundation: context.sysconfig.terafoundation,
                connection: 'default',
                bucket: undefined
            });

            await s3Backend.initialize();

            expect(s3Backend.bucket).toBe(bucketName);
        });

        it('should create a bucket name where underscores in teraslice.name are replaced by dashes', async () => {
            const contextWithUnderscoreName = new TestContext('s3_backend_underscores', contextOptions) as any;
            contextWithUnderscoreName.sysconfig.terafoundation = context.sysconfig.terafoundation;
            s3Backend = new S3Store({
                context: contextWithUnderscoreName,
                terafoundation: contextWithUnderscoreName.sysconfig.terafoundation,
                connection: 'default',
                bucket: undefined
            });

            await s3Backend.initialize();

            expect(s3Backend.bucket).toBe('ts-assets-s3-backend-underscores');

            bucketName = 'ts-assets-s3-backend-underscores';
        });
    });
});
