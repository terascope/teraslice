import fse from 'fs-extra';
import { TerafoundationConfig, TestContext } from '@terascope/job-components';
import { DeleteBucketCommand } from '@aws-sdk/client-s3';
import { S3Store } from 'teraslice';
import { MINIO_HOST } from 'e2e/test/config';

if (!process.env.TEST_MINIO) {
    describe('test to run if not in e2e-external-storage-tests', () => {
        it('tests are disabled', () => {
            expect(true).toEqual(true);
        });
    });
} else {
    describe('S3 backend test', () => {
        let s3Backend: S3Store;
        const context = new TestContext('s3-backend-test') as any;
        const mockTerafoundation: TerafoundationConfig = {
            connectors: {
                s3: {
                    default: {
                        endpoint: MINIO_HOST,
                        accessKeyId: 'minioadmin',
                        secretAccessKey: 'minioadmin',
                        forcePathStyle: true,
                        sslEnabled: false,
                        region: 'test-region'
                    },
                    unrelated: {
                        endpoint: 'null',
                        accessKeyId: 'minioadmin',
                        secretAccessKey: 'minioadmin',
                        forcePathStyle: false,
                        sslEnabled: true
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
                    bucket: 'tera-assets'
                });

                await s3Backend.initialize();
            });

            afterEach(async () => {
                await s3Backend.shutdown();
            });

            it('should throw error trying to verify client if bucket does not exist', async () => {
                const command = new DeleteBucketCommand({
                    Bucket: 'tera-assets'
                });
                await s3Backend.api.send(command);

                const response = await s3Backend.verifyClient();
                expect(response).toEqual(false);
            });

            it('should be able to verify the client is up', async () => {
                const response = await s3Backend.verifyClient();
                expect(response).toEqual(true);

                const command = new DeleteBucketCommand({
                    Bucket: 'tera-assets'
                });
                await s3Backend.api.send(command);
            });
        });

        describe('save and remove assets', () => {
            beforeAll(async () => {
                s3Backend = new S3Store({
                    context,
                    terafoundation: mockTerafoundation,
                    connection: 'default',
                    bucket: 'tera-assets'
                });

                await s3Backend.initialize();
            });

            afterAll(async () => {
                const command = new DeleteBucketCommand({
                    Bucket: 'tera-assets'
                });
                await s3Backend.api.send(command);
                await s3Backend.shutdown();
            });

            it('should be able to write in a zip file to tera_assets bucket', async () => {
                const filePath = 'test/fixtures/assets/example_asset_1.zip';
                await s3Backend.save('ex1', fse.readFileSync(filePath), 1000);
                const result = await s3Backend.list();
                expect(result[0].File).toBe('ex1.zip');
            });

            it('should be able to delete zip file in tera_assets bucket', async () => {
                await s3Backend.remove('ex1');

                const result = await s3Backend.list();
                expect(result).toBeEmpty();
            });

            it('should be able to download asset', async () => {
                const filePath = 'test/fixtures/assets/example_asset_2.zip';
                await s3Backend.save('ex2', fse.readFileSync(filePath), 1000);

                const result = await s3Backend.get('ex2');

                expect(result).toStartWith('UEsDBAo');
                await s3Backend.remove('ex2');
            });
        });
    });
}
