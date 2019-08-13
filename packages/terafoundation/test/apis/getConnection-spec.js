'use strict';

const path = require('path');
const { debugLogger } = require('@terascope/utils');

const esClient = { es: true };
jest.mock('elasticsearch');

const elasticsearch = require('elasticsearch');

elasticsearch.Client.mockImplementation(() => Object.assign({}, esClient));

const api = require('../../lib/api');

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
                    }
                }
            }
        },
        name: 'terafoundation'
    };


    beforeEach(() => {
        jest.clearAllMocks();
        // This sets up the API endpoints in the context.
        api(context);
        context.logger = debugLogger('terafoundation-tests');
    });

    it('should return the default connection', () => {
        const { foundation } = context.apis;
        const config = { type: 'elasticsearch' };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(esClient);
        expect(foundation.getConnection(config).client).not.toBe(client);
        expect(elasticsearch.Client).toHaveBeenCalledTimes(2);
    });

    it('should return the same connection when cached', () => {
        const { foundation } = context.apis;
        const config = { type: 'elasticsearch', endpoint: 'other', cached: true };
        const { client } = foundation.getConnection(config);

        expect(client).toEqual(esClient);
        expect(foundation.getConnection(config).client).toBe(client);
        expect(elasticsearch.Client).toHaveBeenCalledTimes(1);
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
