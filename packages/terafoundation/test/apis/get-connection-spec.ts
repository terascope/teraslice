/* eslint-disable import/first */
import 'jest-extended';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals'
import { debugLogger } from '@terascope/utils';
import { ElasticsearchDistribution } from '@terascope/types';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

const hdfsClient = { hdfs: true };
const redisClient = { redis: true };
const statsdClient = { statsd: true };

// jest.unstable_mockModule('opensearch', () => ({
//     Client: {
//         async info(){
//             return {
//                 version: { number: 1, distribution: ElasticsearchDistribution.opensearch}
//             }
//         }
//     }
// }));

jest.unstable_mockModule('node-webhdfs', () => ({
    WebHDFSClient: jest.fn(() => Object.assign({}, hdfsClient)),
}));

jest.unstable_mockModule('mongoose', () => ({
    connect: jest.fn(),
}));

jest.unstable_mockModule('redis', () => ({
    createClient: jest.fn(() => Object.assign({}, redisClient)),
}));

jest.unstable_mockModule('node-statsd', () => ({
    StatsD: jest.fn(() => Object.assign({}, statsdClient)),
}));

// import opensearch from 'opensearch';
const hdfs = await import('node-webhdfs');
const mongodb = await import('mongoose');
const redis = await import('redis');
const statsd = await import('node-statsd');

import api from '../../src/api/index.js';
import { rejects } from 'assert';

describe('createClient foundation API', () => {
    const invalidConnector = path.join(dirPath, '../fixtures/invalid_connector');
    const context = {
        sysconfig: {
            terafoundation: {
                log_level: 'debug',
                connectors: {
                    [invalidConnector]: {
                        default: {}
                    },
                    hdfs_ha: {
                        default: {},
                        other: {}
                    },
                    hdfs: {
                        default: {}
                    },
                    mongodb: {
                        default: {}
                    },
                    redis: {
                        default: {}
                    },
                    s3: {
                        default: {}
                    },
                    statsd: {
                        default: {}
                    },
                }
            }
        },
        name: 'terafoundation'
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        // This sets up the API endpoints in the context.
        api(context);
        context.logger = debugLogger('terafoundation-tests');
    });

    it('should return the default hdfs_ha connection', async () => {
        const { foundation } = context.apis;
        const config = { type: 'hdfs_ha' };
        const { client } = await foundation.createClient(config);

        expect(client).toEqual(hdfsClient);
        expect(hdfs.WebHDFSClient).toHaveBeenCalledTimes(1);
    });

    it('should return the same hdfs_ha connection when cached', async () => {
        const { foundation } = context.apis;
        const config = { type: 'hdfs_ha', endpoint: 'other', cached: true };
        const { client } = await foundation.createClient(config);
        const { client: secondClient } = await foundation.createClient(config);

        expect(client).toEqual(hdfsClient);
        expect(secondClient).toEqual(client);
        expect(hdfs.WebHDFSClient).toHaveBeenCalledTimes(1);
    });

    it('should return the default hdfs connection', async () => {
        const { foundation } = context.apis;
        const config = { type: 'hdfs' };
        const { client } = await foundation.createClient(config);

        expect(client).toEqual(hdfsClient);
        expect(hdfs.WebHDFSClient).toHaveBeenCalledTimes(1);
    });

    it('should return the default mongodb connection', async () => {
        const { foundation } = context.apis;
        const config = { type: 'mongodb' };
        const { client } = await foundation.createClient(config);

        expect(client).not.toBeNil();
        expect(mongodb.connect).toHaveBeenCalledTimes(1);
    });

    it.todo('should return the default s3 connection');

    it('should return the default redis connection', async () => {
        const { foundation } = context.apis;
        const config = { type: 'redis' };
        const { client } = await foundation.createClient(config);

        expect(client).toEqual(redisClient);
        expect(redis.createClient).toHaveBeenCalledTimes(1);
    });

    it('should return the default statsd connection', async () => {
        const { foundation } = context.apis;
        const config = { type: 'statsd' };
        const { client } = await foundation.createClient(config);

        expect(client).toEqual(statsdClient);
        expect(statsd.StatsD).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for non existent connector', async () => {
        const { foundation } = context.apis;
        await expect(() => foundation.createClient({ type: 'nonexistent' }))
            .rejects.toThrowError('No connection configuration found for nonexistent');
    });

    it('should throw an error for non existent endpoint', async() => {
        const { foundation } = context.apis;
        await expect(() => foundation.createClient({ type: 'hdfs', endpoint: 'nonexistent' }))
            .rejects.toThrowError('No hdfs endpoint configuration found for nonexistent');
    });

    it('should throw an error for invalid connector', async () => {
        const { foundation } = context.apis;
        await expect(() => foundation.createClient({ type: invalidConnector }))
            .rejects.toThrowError('missing required create function');
    });
});
