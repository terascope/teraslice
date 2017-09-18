'use strict';

let context = {
    sysconfig: {
        terafoundation: {
            log_level: 'debug',
            logging: ['file', 'console'],
            log_path: '/tmp'
        }
    },
    name: 'terafoundation'
};


describe('makeLogger foundation API', () => {
    it('should create a logger', () => {
        // This sets up the API endpoints in the context.
        require('../../lib/api')(context);

        const foundation = context.apis.foundation;

        const logger = foundation.makeLogger(context.name, context.name);

        expect(logger.debug).toBeDefined();
        expect(logger.fields.name).toBe('terafoundation');
        // We expect a console and file logger.
        expect(logger.streams.length).toBe(2);
    });

    it('should create an elasticsearch logger', () => {
        context = {
            sysconfig: {
                terafoundation: {
                    log_level: 'debug',
                    logging: ['elasticsearch'],
                    connectors: {
                        elasticsearch: {
                            default: {
                            }
                        }
                    }
                }
            },
            name: 'eslogging'
        };

        require('../../lib/api')(context);
        const foundation = context.apis.foundation;

        const logger = foundation.makeLogger(context.name, context.name);

        expect(logger.debug).toBeDefined();
        expect(logger.fields.name).toBe('eslogging');
        // We expect a console and file logger.
        expect(logger.streams.length).toBe(2);
        expect(logger.streams[1].type).toBe('raw');
    });

    it('setting production with no log_path should fail', () => {
        context = {
            sysconfig: {
                terafoundation: {
                    environment: 'production',
                    log_level: 'debug'
                }
            },
            name: 'terafoundation'
        };

        require('../../lib/api')(context);
        const foundation = context.apis.foundation;

        // This should throw an error on setup of the root logger.
        expect(() => foundation.makeLogger(context.name, context.name))
            .toThrowError('Could not write to log_path: ./logs');
    });

    it('setting production with log_path set to a file should fail', () => {
        context = {
            sysconfig: {
                terafoundation: {
                    environment: 'production',
                    log_level: 'debug',
                    log_path: 'README.md'
                }
            },
            name: 'terafoundation'
        };

        require('../../lib/api')(context);
        const foundation = context.apis.foundation;

        // This should throw an error on setup of the root logger.
        expect(() => foundation.makeLogger(context.name, context.name))
            .toThrowError('Could not write to log_path: README.md');
    });
});
