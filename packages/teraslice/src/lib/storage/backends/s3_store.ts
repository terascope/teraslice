import {
    Logger, TSError, isTest,
    logError, pDelay, pWhile, random
} from '@terascope/core-utils';
import { Context, TerafoundationConfig } from '@terascope/job-components';
import {
    S3ClientResponse,
    createS3Bucket,
    deleteS3Object,
    doesBucketExist,
    getS3Object,
    listS3Objects,
    putS3Object,
    S3Client,
    s3RequestWithRetry
} from '@terascope/file-asset-apis';
import {} from '@terascope/types';
import { makeLogger } from '../../workers/helpers/terafoundation.js';

export interface TerasliceS3StorageConfig {
    context: Context;
    terafoundation: TerafoundationConfig;
    connection: string;
    bucket?: string;
    logger?: Logger;
}

export class S3Store {
    readonly bucket: string;
    readonly connection: string;
    readonly terafoundation: TerafoundationConfig;
    private isShuttingDown: boolean;
    logger: Logger;
    api!: S3Client;
    context: Context;

    constructor(backendConfig: TerasliceS3StorageConfig) {
        const {
            context,
            terafoundation,
            connection,
            bucket,
            logger

        } = backendConfig;

        this.context = context;
        this.bucket = bucket || this.createDefaultBucketName();
        this.connection = connection;
        this.isShuttingDown = false;
        this.logger = logger ?? makeLogger(context, 's3_backend', { storageName: this.bucket });
        this.terafoundation = terafoundation;
    }

    async initialize() {
        const { client } = await this.context.apis.foundation
            .createClient({ type: 's3', cached: true, endpoint: this.connection });

        this.api = client;

        await pWhile(async () => {
            try {
                const exists = await doesBucketExist(client, { Bucket: this.bucket });
                if (!exists) {
                    await createS3Bucket(client, { Bucket: this.bucket });
                }
                const isReady = await this.verifyClient();
                return isReady;
            } catch (err) {
                if (err.Code === 'InvalidAccessKeyId') {
                    throw new TSError(`accessKeyId ${this.terafoundation.connectors.s3[this.connection].accessKeyId} specified in S3 ${this.connection} does not exit: ${err.message}`);
                }
                if (err.Code === 'SignatureDoesNotMatch') {
                    throw new TSError(`secretAccessKey specified in S3 ${this.connection} does not match accessKeyId: ${err.message}`);
                }
                if (err.Code === 'InvalidBucketName') {
                    throw new TSError(`Bucket name does not follow S3 naming rules: ${err.message}`);
                }
                if (err instanceof S3ClientResponse.BucketAlreadyExists) {
                    throw new TSError(`Bucket name ${this.bucket} not available. accessKeyId ${this.terafoundation.connectors.s3[this.connection].accessKeyId} does not own this bucket. ${err.message}`);
                }

                logError(this.logger, err, `Failed attempt connecting to S3 ${this.connection} connection, ${this.bucket} bucket (will retry)`);

                await pDelay(isTest ? 0 : random(2000, 4000));

                return false;
            }
        });
    }

    // TODO: if we want to use the S3 store more generically we can't
    // assume the key will have a '.zip' extension
    async get(recordId: string): Promise<Buffer> {
        const command = {
            Bucket: this.bucket,
            Key: `${recordId}.zip`
        };
        try {
            this.logger.debug(`getting record with id: ${recordId} from s3 ${this.connection} connection, ${this.bucket} bucket.`);
            const client = this.api;
            const bufferArray: Buffer[] = [];
            let triggerReturn = false;
            const response = await s3RequestWithRetry({
                client,
                func: getS3Object,
                params: command
            });
            /// Convert the response body to a Node read stream
            const s3Stream = response.Body as NodeJS.ReadableStream;

            /// Store the data coming into s3 into a buffer array
            s3Stream.on('data', (chunk: Buffer) => {
                bufferArray.push(chunk);
            });
            s3Stream.on('end', () => {
                triggerReturn = true;
            });
            s3Stream.on('error', (err) => {
                throw new TSError(`Unable to get recordId ${recordId} from s3 ${this.connection} connection, ${this.bucket} bucket.
                Reason: ${err.message}`);
            });

            await pWhile(async () => triggerReturn);

            return Buffer.concat(bufferArray);
        } catch (err) {
            if (err instanceof S3ClientResponse.NoSuchKey) {
                throw new TSError(`recordId ${recordId} does not exist in s3 ${this.connection} connection, ${this.bucket} bucket.`, {
                    statusCode: 404
                });
            }
            throw new TSError(`Retrieval of recordId ${recordId} from s3 ${this.connection} connection, ${this.bucket} bucket failed: `, err);
        }
    }

    async save(recordId: string, data: Buffer, timeout: number) {
        try {
            this.logger.debug(`saving recordId ${recordId} to s3 ${this.connection} connection, ${this.bucket} bucket.`);

            const command = {
                Bucket: this.bucket,
                Key: `${recordId}.zip`,
                Body: data
            };

            const timeoutID = setTimeout(() => {
                throw new TSError(`Timeout saving recordId ${recordId}`);
            }, timeout);
            try {
                const client = this.api;
                await s3RequestWithRetry({
                    client,
                    func: putS3Object,
                    params: command
                });
            } catch (err) {
                throw new TSError(`Failure saving recordId ${recordId} to S3: ${err}`);
            } finally {
                clearTimeout(timeoutID);
            }
        } catch (err) {
            throw new TSError(`Error saving recordId ${recordId} to S3 ${this.connection} connection, ${this.bucket} bucket: ${err}`);
        }
    }

    async remove(recordId: string) {
        try {
            this.logger.debug(`removing record ${recordId} from s3 ${this.connection} connection, ${this.bucket} bucket.`);

            const command = {
                Bucket: this.bucket,
                Key: `${recordId}.zip`
            };
            const client = this.api;
            await s3RequestWithRetry({
                client,
                func: deleteS3Object,
                params: command
            });
        } catch (err) {
            throw new TSError(`Error deleting recordId ${recordId} from s3 ${this.connection} connection, ${this.bucket} bucket: ${err}`);
        }
    }

    async list(): Promise<Record<string, any>[]> {
        /// list all keys in bucket
        const objectList: Record<string, any>[] = [];
        let nextContinuationToken;
        let continuePagination = true;
        try {
            do {
                const command = {
                    Bucket: this.bucket,
                    ContinuationToken: nextContinuationToken || undefined,
                    // MaxKeys: 1000  // Default is 1000
                };
                const client = this.api;
                const response: any = await s3RequestWithRetry({
                    client,
                    func: listS3Objects,
                    params: command
                });
                response.Contents?.forEach((c: any) => {
                    const s3Record = {
                        File: c.Key,
                        Size: c.Size,
                        // Created: c.LastModified
                    };
                    objectList.push(s3Record);
                });
                if (!response.IsTruncated) {
                    continuePagination = false;
                    nextContinuationToken = undefined;
                } else {
                    nextContinuationToken = response.NextContinuationToken;
                }
                const recordsReceived = response.Contents?.length || 0;
                this.logger.debug(`Received ${recordsReceived} records from s3 ${this.connection} connection, ${this.bucket} bucket.`);
            } while (continuePagination);
            this.logger.info(`Found ${objectList.length} records in s3 ${this.connection} connection, ${this.bucket} bucket.`);
        } catch (err) {
            throw new TSError(`Error listing records from s3 ${this.connection} connection, ${this.bucket} bucket: ${err}`);
        }
        return objectList;
    }

    /*
    * The S3 client has no built in functionality to determine if the client is connected.
    * If we can make a request to ListS3Objects then we know that the bucket exists and
    * credentials are valid.
    */
    async verifyClient() {
        if (this.isShuttingDown) return false;

        const command = {
            Bucket: this.bucket
        };
        const config = this.terafoundation.connectors.s3[this.connection];
        try {
            const client = this.api;
            await s3RequestWithRetry({
                client,
                func: listS3Objects,
                params: command
            });
            this.logger.debug(`S3 Client verification succeeded. Connection: ${this.connection}, endpoint: ${config.endpoint}`);
            return true;
        } catch (err) {
            this.logger.debug(`S3 Client verification failed. Connection: ${this.connection}, endpoint: ${config.endpoint}: `, err);
            return false;
        }
    }

    async waitForClient() {
        this.logger.debug('waiting for s3 client');
        if (await this.verifyClient()) return;

        await pWhile(async () => {
            if (this.isShuttingDown) throw new Error('S3 store is shutdown');
            if (await this.verifyClient()) return true;
            await pDelay(100);
            return false;
        });
    }

    async shutdown() {
        this.isShuttingDown = true;
        this.api.destroy();
    }

    // TODO: Use more generic bucket prefix (not related to assets)
    // or pass in prefix from calling class
    createDefaultBucketName(): string {
        const safeName = this.context.sysconfig.teraslice.name.replaceAll('_', '-');
        return `ts-assets-${safeName}`;
    }
}
