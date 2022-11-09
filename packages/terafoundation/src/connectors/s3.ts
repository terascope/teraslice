import fs from 'fs';
import https from 'https';
import { Logger } from '@terascope/utils';
import bluebird from 'bluebird';
// @ts-expect-error
import * as S3 from 'aws-sdk/clients/s3';

const { promisifyAll } = bluebird;

function create(customConfig: Record<string, any>, logger: Logger): {
    client: any;
} {
    logger.info(`Using S3 endpoint: ${customConfig.endpoint}`);

    // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-registering-certs.html
    // Instead of updating the client, we can just update the config before creating the client
    if (customConfig.sslEnabled) {
        if (customConfig.certLocation.length === 0) {
            throw new Error(
                `Must provide a certificate for S3 endpoint ${customConfig.endpoint} since SSL is enabled`
            );
        }
        // Assumes all certs needed are in a single bundle
        const certs = [
            fs.readFileSync(customConfig.certLocation)
        ];
        if (!customConfig.httpOptions) customConfig.httpOptions = {};
        customConfig.httpOptions.agent = new https.Agent({
            rejectUnauthorized: true,
            ca: certs
        });
    }

    const client = new S3(customConfig);

    return {
        client: promisifyAll(client, { suffix: '_Async' })
    };
}

export default {
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        return create(customConfig, logger);
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
            s3ForcePathStyle: {
                doc: '',
                default: false,
                format: Boolean
            },
            s3BucketEndpoint: {
                doc: '',
                default: false,
                format: Boolean
            }
        };
    }
};
