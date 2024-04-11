import { Logger } from '@terascope/utils';
import { createS3Client, S3ClientConfig } from '@terascope/file-asset-apis';
import { Terafoundation } from '@terascope/types';

export default {
    create() {
        throw new Error('s3 does not support the deprecated "create" method, please use file-assets >= v2.4.0');
    },
    async createClient(customConfig: S3ClientConfig, logger: Logger) {
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
                doc: 'DEPRECATED - use caCertificate. Location of ssl cert.',
                default: '',
                format: String
            },
            caCertificate: {
                doc: 'A string containing a single or multiple ca certificates',
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
    validate_config<S>(
        subconfig: S3ClientConfig,
        _sysconfig: Terafoundation.SysConfig<S>
    ): void {
        const caCertExists: boolean = (subconfig.caCertificate?.length !== 0);
        const certLocationExists: boolean = (subconfig.certLocation?.length !== 0);
        if (caCertExists && certLocationExists) {
            throw new Error('"caCertificate" and "certLocation" contradict.\n'
            + '  Use only one or the other.');
        } else if (
            (caCertExists && !subconfig.sslEnabled)
            || (certLocationExists && !subconfig.sslEnabled)
        ) {
            throw new Error('A certificate is provided but sslEnabled is set to "false".\n'
                + '  Set sslEnabled to "true" or don\'t provide a certificate.');
        }
    }
};
