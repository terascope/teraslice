import { Logger } from '@terascope/utils';
import { createS3Client } from '@terascope/file-asset-apis';

export default {
    create() {
        throw new Error('s3 does not support the deprecated "create" method, please use file-assets >= v2.4.0');
    },
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
            sslEnabled: {
                doc: '',
                default: true,
                format: Boolean
            },
            certLocation: {
                doc: 'DEPRICATED: Location of ssl cert.',
                default: '',
                format: String
            },
            caCertificate: {
                doc: 'A base64 string of an ssl cert.',
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
    },
    validate_config(config: any): void {
        const caCertExists: boolean = (config.caCertificate.length !== 0);
        const certLocationExists: boolean = (config.certLocation.length !== 0);
        if (caCertExists && certLocationExists) {
            throw new Error('"caCertificate" and "certLocation" contradict inside of the s3 connection config. '
            + 'Use only one or the other.');
        } else if (
            (caCertExists && !config.sslEnabled)
            || (certLocationExists && !config.sslEnabled)
        ) {
            throw new Error('A certificate is provided but sslEnabled is set to "false".\n'
                + 'Set sslEnabled to "true" or don\'t provide a certificate inside of the s3 connection config.');
        }
    }
};
