import 'jest-extended';
import { ProcessContext } from '../src';

describe('Terafoundation (ProcessContext)', () => {
    it('should be able to return a valid context', () => {
        const context = new ProcessContext({
            name: 'example',
        } as any, {
            configfile: {
                terafoundation: {
                    environment: process.env.NODE_ENV,
                }
            }
        } as any);
        expect(context).toHaveProperty('assignment');
        expect(context).toHaveProperty('name', 'example');
        expect(context).toHaveProperty('cluster.worker.id');
        expect(context).toHaveProperty('logger');
        expect(context).toHaveProperty('arch', process.arch);
        expect(context).toHaveProperty('platform', process.platform);
        expect(context).toHaveProperty('sysconfig._nodeName');
        expect(context).toHaveProperty('apis.foundation.startWorkers');
        expect(context).toHaveProperty('foundation.startWorkers');
        expect(context).toHaveProperty('apis.foundation.makeLogger');
        expect(context).toHaveProperty('foundation.makeLogger');
        expect(context).toHaveProperty('apis.foundation.getConnection');
        expect(context).toHaveProperty('foundation.getConnection');
        expect(context).toHaveProperty('apis.foundation.getSystemEvents');
        expect(context).toHaveProperty('foundation.getEventEmitter');

        context.apis.foundation.getSystemEvents().removeAllListeners();
    });

    it('should throw an error when given an invalid system config', () => {
        expect(() => {
            new ProcessContext({ a: true } as any, { configfile: 'invalid' } as any);
        }).toThrowError('Terafoundation requires a valid system configuration');
    });

    it('should throw an error when given an invalid application config', () => {
        expect(() => {
            new ProcessContext('invalid' as any, { } as any);
        }).toThrowError('Terafoundation requires a valid application configuration');
    });
});
