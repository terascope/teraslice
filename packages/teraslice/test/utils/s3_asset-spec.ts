import { S3Store, TerasliceS3StorageConfig } from '../../src/lib/storage/backends/s3_store';
import { Context } from 'packages/types/dist/src/terafoundation';
import { TerafoundationConfig } from '@terascope/job-components';
import fse from 'fs-extra';

describe('S3 backend test', () => {

    let s3Backend: S3Store;
    const mockTerafoundation: TerafoundationConfig = {
        connectors: {
            s3: {
                default: {
                    endpoint: "http://localhost:9000",
                    accessKeyId: "minioadmin",
                    secretAccessKey: "minioadmin",
                    forcePathStyle: true,
                    sslEnabled: false,
                    region: "test-region"
                },
                unrelated: {
                    endpoint: "null",
                    accessKeyId: "minioadmin",
                    secretAccessKey: "minioadmin",
                    forcePathStyle: false,
                    sslEnabled: true
                }
            }
        }
    }

    beforeAll(async () => {

        s3Backend = new S3Store({
            terafoundation: mockTerafoundation,
            connector: 'default',
            bucket: 'tera-asset2'
        });

        await s3Backend.initialize();

    });

    afterAll(async () => {
        await s3Backend.shutdown();
    });

    it('should be able to write in a zip file to tera_assets bucket', async () => {
        const filePath = `${process.cwd()}/e2e/autoload/elasticsearch-v3.5.4-node-18-bundle.zip`;
        await s3Backend.save('asset123',  fse.readFileSync(filePath), 1000);
    });

    it('should be able to write in a zip file to tera_assets bucket', async () => {
        const filePath = `${process.cwd()}/e2e/autoload/kafka-v3.5.2-node-18-bundle.zip`;
        await s3Backend.save('asset007',  fse.readFileSync(filePath), 1000);

        // now delete it
        await s3Backend.remove('asset007');
        await s3Backend.remove('asset123');

    });
});