/* eslint-disable import/first */
import 'jest-extended';
import path from 'path';
import { debugLogger } from '@terascope/utils';

jest.mock('elasticsearch');
jest.mock('node-webhdfs');
jest.mock('mongoose');
jest.mock('redis', () => ({
    createClient: jest.fn(),
}));
// jest.mock('aws-sdk');
jest.mock('node-statsd');

import elasticsearch from 'elasticsearch';
// @ts-expect-error
import hdfs from 'node-webhdfs';
import mongodb from 'mongoose';
import redis from 'redis';
// const aws = require('aws-sdk');
// @ts-expect-error
import statsd from 'node-statsd';

const esClient = { es: true };
// @ts-expect-error
elasticsearch.Client.mockImplementation(() => Object.assign({}, esClient));

const hdfsClient = { hdfs: true };
hdfs.WebHDFSClient.mockImplementation(() => Object.assign({}, hdfsClient));

mongodb.connect = jest.fn();

const redisClient = { redis: true };
// @ts-expect-error
redis.createClient.mockImplementation(() => Object.assign({}, redisClient));

// const awsClient = { aws: true };
// aws.S3.mockImplementation(() => Object.assign({}, awsClient));

const statsdClient = { statsd: true };
statsd.StatsD.mockImplementation(() => Object.assign({}, statsdClient));

import api from '../../src/api.js';

describe('getConnection foundation API', () => {
    const invalidConnector = path.join(__dirname, '../fixtures/invalid_connector');
    const context = {
        sysconfig: {
            terafoundation: {
                log_level: 'debug',
                connectors: {
                    elasticsearch: {
                        default: {},
                        other: {}
                    },
                    [invalidConnector]: {
                        default: {}
                    },
                    hdfs_ha: {
                        default: {}
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

    it('should return the default elasticsearch connection', () => {
        const { foundation } = context.apis;
        const config = { type: 'elasticsearch' };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(esClient);
        expect(foundation.getConnection(config).client).not.toBe(client);
        expect(elasticsearch.Client).toHaveBeenCalledTimes(2);
    });

    it('should return the same elasticsearch connection when cached', () => {
        const { foundation } = context.apis;
        const config = { type: 'elasticsearch', endpoint: 'other', cached: true };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(esClient);
        expect(foundation.getConnection(config).client).toBe(client);
        expect(elasticsearch.Client).toHaveBeenCalledTimes(1);
    });

    it('should return the default hdfs_ha connection', () => {
        const { foundation } = context.apis;
        const config = { type: 'hdfs_ha' };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(hdfsClient);
        expect(hdfs.WebHDFSClient).toHaveBeenCalledTimes(1);
    });

    it('should return the default hdfs connection', () => {
        const { foundation } = context.apis;
        const config = { type: 'hdfs' };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(hdfsClient);
        expect(hdfs.WebHDFSClient).toHaveBeenCalledTimes(1);
    });

    it('should return the default mongodb connection', () => {
        const { foundation } = context.apis;
        const config = { type: 'mongodb' };
        const { client } = foundation.getConnection(config);

        expect(client).not.toBeNil();
        expect(mongodb.connect).toHaveBeenCalledTimes(1);
    });

    it.todo('should return the default s3 connection');

    it('should return the default redis connection', () => {
        const { foundation } = context.apis;
        const config = { type: 'redis' };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(redisClient);
        expect(redis.createClient).toHaveBeenCalledTimes(1);
    });

    it('should return the default statsd connection', () => {
        const { foundation } = context.apis;
        const config = { type: 'statsd' };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(statsdClient);
        expect(statsd.StatsD).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for non existent connector', () => {
        const { foundation } = context.apis;
        expect(() => foundation.getConnection({ type: 'nonexistent' }))
            .toThrowError('No connection configuration found for nonexistent');
    });

    it('should throw an error for non existent endpoint', () => {
        const { foundation } = context.apis;
        expect(() => foundation.getConnection({ type: 'elasticsearch', endpoint: 'nonexistent' }))
            .toThrowError('No elasticsearch endpoint configuration found for nonexistent');
    });

    it('should throw an error for invalid connector', () => {
        const { foundation } = context.apis;
        expect(() => foundation.getConnection({ type: invalidConnector }))
            .toThrowError('missing required create function');
    });
});
