/* eslint-disable import/first */
import 'jest-extended';
import path from 'path';
import { debugLogger } from '@terascope/utils';

jest.mock('node-webhdfs');
// @ts-expect-error
import hdfs from 'node-webhdfs';

const hdfsClient = { hdfs: true };
hdfs.WebHDFSClient.mockImplementation(() => Object.assign({}, hdfsClient));

import api from '../../src/api';

describe('getConnection foundation API', () => {
    const invalidConnector = path.join(__dirname, '../fixtures/invalid_connector');
    const context = {
        sysconfig: {
            terafoundation: {
                log_level: 'debug',
                connectors: {
                    [invalidConnector]: {
                        default: {}
                    },
                    hdfs_ha: {
                        default: {}
                    },
                    hdfs: {
                        default: {},
                        other: {}
                    },
                    s3: {
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

    it('should return the default hdfs connection', () => {
        const { foundation } = context.apis;
        const config = { type: 'hdfs' };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(hdfsClient);
        expect(hdfs.WebHDFSClient).toHaveBeenCalledTimes(1);
    });

    it('should return the same elasticsearch connection when cached', () => {
        const { foundation } = context.apis;
        const config = { type: 'hdfs', endpoint: 'other', cached: true };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(hdfsClient);
        expect(foundation.getConnection(config).client).toBe(client);
        expect(hdfs.WebHDFSClient).toHaveBeenCalledTimes(1);
    });

    it('should return the default hdfs_ha connection', () => {
        const { foundation } = context.apis;
        const config = { type: 'hdfs_ha' };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(hdfsClient);
        expect(hdfs.WebHDFSClient).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for non existent connector', () => {
        const { foundation } = context.apis;
        expect(() => foundation.getConnection({ type: 'nonexistent' }))
            .toThrowError('No connection configuration found for nonexistent');
    });

    it('should throw an error for non existent endpoint', () => {
        const { foundation } = context.apis;
        expect(() => foundation.getConnection({ type: 'hdfs', endpoint: 'nonexistent' }))
            .toThrowError('No hdfs endpoint configuration found for nonexistent');
    });

    it('should throw an error for invalid connector', () => {
        const { foundation } = context.apis;
        expect(() => foundation.getConnection({ type: invalidConnector }))
            .toThrowError('missing required create function');
    });
});
