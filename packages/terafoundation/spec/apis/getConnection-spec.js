'use strict';

const fakeLogger = require('../helpers/fakeLogger');

const context = {
    sysconfig: {
        terafoundation: {
            log_level: 'debug',
            connectors: {
                elasticsearch: {
                    default: {

                    }
                }
            }
        }
    },
    name: 'terafoundation'
};

// This sets up the API endpoints in the context.
require('../../lib/api')(context);

context.logger = fakeLogger;

describe('getConnection foundation API', () => {
    const foundation = context.apis.foundation;

    it('should return the default connection', () => {
        expect(foundation.getConnection({ type: 'elasticsearch' }).client).toBeDefined();
    });

    it('should throw an error for non existent connector', () => {
        expect(() => foundation.getConnection({ type: 'nonexistent' }))
            .toThrowError('No connection configuration found for nonexistent');
    });

    it('should throw an error for non existent endpoint', () => {
        expect(() => foundation.getConnection({ type: 'elasticsearch', endpoint: 'nonexistent' }))
            .toThrowError('No elasticsearch endpoint configuration found for nonexistent');
    });
});
