import fse from 'fs-extra';
import { TerafoundationConfig, TestContext } from '@terascope/job-components';
import { DeleteBucketCommand } from '@aws-sdk/client-s3';
import { S3Store } from '../../src/lib/storage/backends/s3_store';

describe('S3 backend test', () => {
    let s3Backend: S3Store;
    const context = new TestContext('s3-backend-test') as any;
    const mockTerafoundation: TerafoundationConfig = {
        connectors: {
            s3: {
                default: {
                    endpoint: 'http://127.0.0.1:9000',
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
            const filePath = `${process.cwd()}/e2e/autoload/elasticsearch-v3.5.7-node-18-bundle.zip`;
            await s3Backend.save('asset123', fse.readFileSync(filePath), 1000);
            const result = await s3Backend.list();
            console.log('result1: ', result);
            expect(result).toInclude('asset123');
        });

        it('should be able to delete zip file in tera_assets bucket', async () => {
            const filePath = `${process.cwd()}/e2e/autoload/kafka-v3.5.5-node-18-bundle.zip`;
            await s3Backend.save('asset007', fse.readFileSync(filePath), 1000);

            // now delete it
            await s3Backend.remove('asset007');
            await s3Backend.remove('asset123');

            const result = await s3Backend.list();
            console.log('result2: ', result);
            /// We need to fix this to return an empty string
            expect(result).toBe(undefined);
            // expect(result).not.toInclude('asset123');
            // expect(result).not.toInclude('asset007');
        });

        it('should be able to download asset', async () => {
            const filePath = `${process.cwd()}/e2e/autoload/kafka-v3.5.5-node-18-bundle.zip`;
            await s3Backend.save('asset444', fse.readFileSync(filePath), 1000);

            const result = await s3Backend.get('asset444');

            expect(typeof result).toBe('string');
            /// Weak test, should create temp folder and save into file.
            /// It may also be useful to look at and very the asset.json contents
            /// Note: I can kill two birds with one stone by creating a large asset
            /// for this test.
            await s3Backend.remove('asset444');
        });
    });
});
