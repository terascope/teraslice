'use strict';

const api = require('../../lib/api');

describe('makeLogger foundation API', () => {
    it('should create a logger', async () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    environment: 'development',
                    log_level: 'debug',
                    logging: ['file', 'console'],
                    log_path: '/tmp'
                }
            },
            name: 'terafoundation'
        };
        api(context);
        const { foundation } = context.apis;

        const logger = foundation.makeLogger(context.name, context.name);

        expect(logger.debug).toBeFunction();
        expect(logger.fields.name).toBe('terafoundation');
        // We expect a console and file logger.
        expect(logger.streams).toHaveLength(2);

        await expect(logger.flush()).toResolve();
    });

    it('setting production with no log_path should fail', () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    environment: 'production',
                    log_level: 'debug'
                }
            },
            name: 'terafoundation'
        };

        api(context);
        const { foundation } = context.apis;

        // This should throw an error on setup of the root logger.
        expect(() => foundation.makeLogger(context.name, context.name))
            .toThrowError('Could not write to log_path: ./logs');
    });

    it('setting production with log_path set to a file should fail', () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    environment: 'production',
                    log_level: 'debug',
                    log_path: 'README.md'
                }
            },
            name: 'terafoundation'
        };

        api(context);
        const { foundation } = context.apis;

        // This should throw an error on setup of the root logger.
        expect(() => foundation.makeLogger(context.name, context.name))
            .toThrowError('Could not write to log_path: README.md');
    });
});
