/* eslint-disable default-param-last */
import ms from 'ms';
import {
    TSError, parseError, isTest, pDelay,
    pRetry, logError, pWhile, isString, getTypeOf,
    get, random, isInteger, Logger
} from '@terascope/utils';
import { 
    CreateBucketCommand, 
    PutObjectCommand, 
    DeleteObjectCommand, 
    GetObjectCommand 
} from '@aws-sdk/client-s3';
import elasticsearchApi from '@terascope/elasticsearch-api';
import { getClientAsync, Context, TerafoundationConfig } from '@terascope/job-components';
import { ClientParams } from '@terascope/types';
import { makeLogger } from '../../workers/helpers/terafoundation.js';
import { timeseriesIndex } from '../../utils/date_utils.js';
import analyticsSchema from './mappings/analytics.json' assert { type: 'json' };
import assetSchema from './mappings/asset.json' assert { type: 'json' };
import executionSchema from './mappings/ex.json' assert { type: 'json' };
import jobsSchema from './mappings/job.json' assert { type: 'json' };
import stateSchema from './mappings/state.json' assert { type: 'json' };
import { TerasliceStorageOptions, TerasliceStorageConfig } from './elasticsearch_store';
import { createS3Client, S3Client, S3ClientConfig } from '@terascope/file-asset-apis';


export interface TerasliceS3StorageConfig {
    // context: Context;
    terafoundation: TerafoundationConfig;
    connector: string;
    bucket?: string;
}

export class S3Store {
    // readonly context: Context;
    readonly connector: string;
    readonly bucket: string;
    readonly config: S3ClientConfig;
    readonly terafoundation: TerafoundationConfig;
    api!: S3Client;

    constructor(backendConfig: TerasliceS3StorageConfig) {
        const {
            // context,
            terafoundation,
            connector,
            bucket

        } = backendConfig;

        // this.context = context;
        // this.terafoundation = this.context.sysconfig.terafoundation;
        this.terafoundation = terafoundation;
        this.connector = connector;
        this.bucket = bucket || 'tera-assets';
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
            region: this.terafoundation.connectors.s3[this.connector].region
        }
    }

    async initialize() {
        /// create client
        this.api = await createS3Client(this.config);
        /// create bucket for assets
        const input = {
            "Bucket": this.bucket
        };
        const command = new CreateBucketCommand(input);
        const response = await this.api.send(command);
        console.log('Bucket creation response: ', response);
    }

    async get(recordId: string) {
        /// Get an asset
        const command = new GetObjectCommand({
            Bucket: this.bucket, 
            Key: `${recordId}.zip`
        });
        const response = await this.api.send(command);
        const s3File = await response.Body?.transformToString('base64');
        console.log('GET response: ', response);
        console.log(`Grabbed ${recordId}.zip from ${this.bucket} bucket`);
        if (typeof s3File === 'string') {
            return s3File as string;
        } else {
            throw new TSError(`Unable to get asset ${recordId} from s3`);
        }
    }

    async save(recordId: string, data: Buffer, timeout: number) {
        /// Save the asset
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: `${recordId}.zip`,
            Body: data
        });
        const response = await this.api.send(command);
        console.log('SAVE response: ', response);
        console.log(`Upladed ${recordId}.zip to ${this.bucket} bucket`);
    }

    async remove(recordId: string) {
        /// remove an asset
        const command = new DeleteObjectCommand({
            Bucket: this.bucket, 
            Key: `${recordId}.zip`
        });
        const response = await this.api.send(command);
        console.log('REMOVE response: ', response);
        console.log(`Deleted ${recordId}.zip from ${this.bucket} bucket`);
    }


    async shutdown(forceShutdown = false) {
        /// close the connection
        this.api.destroy();
    }
}