import { Logger } from '@terascope/utils';
import { createS3Client } from '@terascope/file-asset-apis';
import { TerafoundationConnector } from '../interfaces.js';

const connector: TerafoundationConnector = {
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        const client = await createS3Client(customConfig, logger);
        return { client, logger };
    },
    config_schema(): Record<string, any> {
        return {
            endpoint: {
                doc: 'Target S3 endpoint',
                default: '127.0.0.1:80'
            },
            accessKeyId: {
                doc: '',
                default: null,
                format: String
            },
            secretAccessKey: {
                doc: '',
                default: null,
                format: String
            },
            region: {
                doc: '',
                default: 'us-east-1',
                format: String
            },
            maxRetries: {
                doc: '',
                default: 3,
                format: Number
            },
            maxRedirects: {
                doc: '',
                default: 10,
                format: Number
            },
            sslEnabled: {
                doc: '',
                default: true,
                format: Boolean
            },
            certLocation: {
                doc: 'Location of ssl cert. Must be provided if `sslEnabled` is true',
                default: '',
                format: String
            },
            forcePathStyle: {
                doc: '',
                default: false,
                format: Boolean
            },
            bucketEndpoint: {
                doc: '',
                default: false,
                format: Boolean
            }
        };
    }
};

export default connector;
