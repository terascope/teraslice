/* eslint-disable default-param-last */
import {
    Logger, TSError, isTest, logError, pDelay, pWhile, random
} from '@terascope/utils';
import {
    BucketAlreadyExists,
    BucketAlreadyOwnedByYou,
    CreateBucketCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    NoSuchKey,
    PutObjectCommand
} from '@aws-sdk/client-s3';
import { Context, TerafoundationConfig } from '@terascope/job-components';
import { createS3Client, S3Client, S3ClientConfig } from '@terascope/file-asset-apis';
import { HttpHandlerOptions } from '@smithy/types';
import { makeLogger } from '../../workers/helpers/terafoundation.js';

export interface TerasliceS3StorageConfig {
    context: Context;
    terafoundation: TerafoundationConfig;
    connection: string;
    bucket?: string;
    logger?: Logger
}

export class S3Store {
    readonly bucket: string;
    readonly config: S3ClientConfig;
    readonly connector: string;
    readonly terafoundation: TerafoundationConfig;
    private isShuttingDown: boolean;
    logger: Logger;
    api!: S3Client;

    constructor(backendConfig: TerasliceS3StorageConfig) {
        const {
            context,
            terafoundation,
            connection: connector,
            bucket,
            logger

        } = backendConfig;

        this.bucket = bucket || 'tera-assets';
        this.connector = connector;
        this.isShuttingDown = false;
        this.logger = logger ?? makeLogger(context, 's3_backend', { storageName: this.bucket });
        this.terafoundation = terafoundation;
        /// Will need to make config flexable for missing fields
        this.config = {
            endpoint: this.terafoundation.connectors.s3[this.connector].endpoint,
            credentials: {
                accessKeyId: this.terafoundation.connectors.s3[this.connector].accessKeyId,
                secretAccessKey: this.terafoundation.connectors.s3[this.connector].secretAccessKey,
            },
            maxAttempts: 4,
            forcePathStyle: this.terafoundation.connectors.s3[this.connector].forcePathStyle,
            sslEnabled: this.terafoundation.connectors.s3[this.connector].sslEnabled,
            region: this.terafoundation.connectors.s3[this.connector].region,
        };
    }

    async initialize() {
        this.api = await createS3Client(this.config);
        const input = {
            Bucket: this.bucket
        };
        const command = new CreateBucketCommand(input);

        await pWhile(async () => {
            try {
                await this.api.send(command);
                const isReady = await this.verifyClient();
                return isReady;
            } catch (err) {
                if (err instanceof BucketAlreadyOwnedByYou) {
                    const isReady = await this.verifyClient();
                    return isReady;
                }
                if (err.Code === 'InvalidAccessKeyId') {
                    throw new TSError(`accessKeyId specified in ${this.connector} does not exit: ${err.message}`);
                }
                if (err.Code === 'SignatureDoesNotMatch') {
                    throw new TSError(`secretAccessKey specified in ${this.connector} does not match: ${err.message}`);
                }
                if (err instanceof BucketAlreadyExists) {
                    throw new TSError(`Bucket name not available. Do you have the right credentials? ${err.message}`);
                }

                logError(this.logger, err, `Failed attempt connecting to S3 bucket: ${this.bucket} (will retry)`);

                await pDelay(isTest ? 0 : random(2000, 4000));

                return false;
            }
        });
    }

    async get(recordId: string) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: `${recordId}.zip`
        });
        try {
            this.logger.trace(`getting record with id: ${recordId} from ${this.bucket} bucket`);

            const response = await this.api.send(command);
            const s3File = await response.Body?.transformToString('base64');
            if (typeof s3File !== 'string') {
                throw new TSError(`Unable to get asset ${recordId} from s3`);
            }
            return s3File;
        } catch (err) {
            if (err instanceof NoSuchKey) {
                throw new TSError(`Asset with id: ${recordId} does not exist in S3 asset store`, {
                    statusCode: 404
                });
            }
            throw new TSError(`Retrieval of asset with id: ${recordId} from s3 store failed: `, err);
        }
    }

    async save(recordId: string, data: Buffer, timeout: number) {
        try {
            this.logger.trace(`saving record id: ${recordId} to ${this.bucket} bucket`);

            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: `${recordId}.zip`,
                Body: data
            });
            const options: HttpHandlerOptions = {
                // FIXME: this is only related to time it takes to connect, not get a response
                requestTimeout: timeout
            };
            await this.api.send(command, options);
        } catch (err) {
            throw new TSError(`Error saving asset to S3: ${err}`);
        }
    }

    async remove(recordId: string) {
        try {
            this.logger.trace(`removing record ${recordId} from ${this.bucket} bucket`);

            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: `${recordId}.zip`
            });
            await this.api.send(command);
        } catch (err) {
            throw new TSError(`Error deleting asset from S3: ${err}`);
        }
    }

    async list(): Promise<Record<string, any>[]> {
        /// list all asset keys in bucket
        let objectList: Record<string, any>[] = [];
        let nextContinuationToken;
        let continuePagination = true;

        do {
            const command = new ListObjectsV2Command({
                Bucket: this.bucket,
                ContinuationToken: nextContinuationToken || undefined,
                // MaxKeys: 1000  // Default is 1000
            });
            const response: any = await this.api.send(command);
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
        } while(continuePagination);
        return objectList;
    }

    /*
    * The S3 client has no built in functionality to determine if the client is connected.
    * If we can make a request to ListObjectsV2Command then we know that the bucket exists and
    * credentials are valid.
    */
    async verifyClient() {
        if (this.isShuttingDown) return false;
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            MaxKeys: 0
        });
        try {
            await this.api.send(command);
            this.logger.trace('Client verification successful');
            return true;
        } catch (err) {
            this.logger.trace('Client verification failed: ', err);
            return false;
        }
    }

    async waitForClient() {
        this.logger.trace('waiting for s3 client');
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
}
