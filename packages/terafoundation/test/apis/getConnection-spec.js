'use strict';

const path = require('path');
const { debugLogger } = require('@terascope/utils');
const api = require('../../lib/api');

describe('getConnection foundation API', () => {
    const invalidConnector = path.join(__dirname, '../fixtures/invalid_connector');
    const context = {
        sysconfig: {
            terafoundation: {
                log_level: 'debug',
                connectors: {
                    elasticsearch: {
                        default: {}
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
        // This sets up the API endpoints in the context.
        api(context);
        context.logger = debugLogger('terafoundation-tests');
    });

    it('should return the default connection', () => {
        const { foundation } = context.apis;
        expect(foundation.getConnection({ type: 'elasticsearch' }).client).toBeDefined();
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
