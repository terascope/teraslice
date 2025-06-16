import 'jest-extended';
import api from '../../src/api/index.js';

process.env.USE_DEBUG_LOGGER = 'false';

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
        } as any;
        api(context);

        const { logger } = context;
        expect(logger.debug).toBeFunction();
        expect(logger.fields.name).toBe('terafoundation');
        // We expect a console and file logger.
        expect(logger.streams).toHaveLength(2);

        await expect(logger.flush()).toResolve();
    });

    it('setting logging to file with no log_path should fail', () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    logging: ['file'],
                    log_level: 'debug',
                }
            },
            name: 'terafoundation'
        } as any;

        expect(() => {
            api(context);
        }).toThrow('Could not write to log_path: ./logs');
    });

    it('setting logging to file with log_path set to a file should fail', () => {
        const context = {
            sysconfig: {
                terafoundation: {
                    logging: ['file'],
                    log_level: 'debug',
                    log_path: 'README.md'
                }
            },
            name: 'terafoundation'
        } as any;

        expect(() => {
            api(context);
        }).toThrow('Could not write to log_path: README.md');
    });
});
