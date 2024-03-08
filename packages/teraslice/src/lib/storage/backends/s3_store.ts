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
import ms from 'ms';
import { makeLogger } from '../../workers/helpers/terafoundation.js';

export interface TerasliceS3StorageConfig {
    context: Context;
    terafoundation: TerafoundationConfig;
    connector: string;
    bucket?: string;
    logger?: Logger
}

export class S3Store {
    // readonly context: Context;
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
            connector,
            bucket,
            logger

        } = backendConfig;

        this.bucket = bucket || `tera-assets-${context.sysconfig.teraslice.name}`;
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
        /// create client
        this.api = await createS3Client(this.config);
        /// create bucket for assets
        const input = {
            Bucket: this.bucket
        };
        const command = new CreateBucketCommand(input);

        await pWhile(async () => {
            try {
                const response = await this.api.send(command);
                console.log('Bucket creation response: ', response);
                const isReady = await this.verifyClient();
                return isReady;
            } catch (err) {
                // console.log('@@@@ this.config: ', this.config);
                // console.log('@@@@ err: ', err);
                // console.log('@@@@ err code: ', err.Code);
                // console.log('@@@@ err.message: ', err.message);
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
        /// Get an asset
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: `${recordId}.zip`
        });
        try {
            this.logger.trace(`getting record id: ${recordId}`);

            const response = await this.api.send(command);
            const s3File = await response.Body?.transformToString('base64');
            console.log('GET response: ', response);
            console.log(`Grabbed ${recordId}.zip from ${this.bucket} bucket`);
            if (typeof s3File !== 'string') {
                throw new TSError(`Unable to get asset ${recordId} from s3`);
            }
            return s3File;
        } catch (err) {
            if (err instanceof NoSuchKey) {
                throw new TSError(`Asset with id: ${recordId} does not exist in S3 asset store`);
            }
            throw new TSError(`Retrieval of asset with id: ${recordId} from s3 store failed: `, err);
        }
    }

    async save(recordId: string, data: Buffer, timeout: number) {
        try {
            this.logger.trace(`saving record id: ${recordId} to S3 bucket`);

            /// Save the asset
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: `${recordId}.zip`,
                Body: data
            });
            const options: HttpHandlerOptions = {
                requestTimeout: timeout // FIXME: this is only related to time it takes to connect, not get a response
            };
            const response = await this.api.send(command, options);
            console.log('SAVE response: ', response);
            console.log(`Upladed ${recordId}.zip to ${this.bucket} bucket`);
        } catch (err) {
            throw new TSError(`Error saving asset to S3: ${err}`);
        }
    }

    async remove(recordId: string) {
        try {
            this.logger.trace(`removing record ${recordId} from S3`);

            /// remove an asset
            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: `${recordId}.zip`
            });
            const response = await this.api.send(command);
            console.log('REMOVE response: ', response);
            console.log(`Deleted ${recordId}.zip from ${this.bucket} bucket`);
        } catch (err) {
            throw new TSError(`Error deleting asset from S3: ${err}`);
        }
    }

    async list(): Promise<Record<string, any>[]> {
        /// list all asset keys in bucket
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            // MaxKeys: 1000  // Default is 1000
        });
        const response = await this.api.send(command);
        console.log('LIST response: ', response);
        const contentsList: Record<string, any>[] = [];
        // response.Contents?.map((c) => ` • ${c.Key}`).join('\n');
        response.Contents?.map((c) => {
            const s3Record = {
                File: c.Key,
                Size: c.Size,
                // Created: c.LastModified
            };
            contentsList.push(s3Record);
        });
        console.log(`Keys inside ${this.bucket}: \n`, contentsList);
        /// We need to figure out exactly how we want to format this or
        /// if we just want to pass each key inside an array and have something else
        // format it.
        /// returns string array
        return contentsList;
    }

    async verifyClient() {
        if (this.isShuttingDown) return false;
        // if we can list objects then we know the bucket exists and credentials work
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            MaxKeys: 0
        });
        // the request should throw if connection to client fails
        try {
            const response = await this.api.send(command);
            console.log('verifyClient response: ', response);
            return true;
        } catch (err) {
            console.log('verifyClient error: ', err);
            return false;
        }
    }

    async waitForClient() {
        const timeoutMs = ms(process.env.SERVICE_UP_TIMEOUT ?? '2m');
        console.log('waiting for s3 client');
        if (await this.verifyClient()) return;

        await pWhile(async () => {
            if (this.isShuttingDown) throw new Error('S3 store is shutdown');
            if (await this.verifyClient()) return true;
            await pDelay(100);
            return false;
        }, { timeoutMs });
    }

    async shutdown() {
        /// close the connection
        this.api.destroy();
        this.isShuttingDown = true;
    }
}
