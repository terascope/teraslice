import 'jest-extended';
import { singleContext } from '../src';

describe('Terafoundation (singleContext)', () => {
    it('should be able to return a valid context', () => {
        const context = singleContext({
            name: 'example',
        } as any, {
            sysconfig: {
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
        expect(() => { singleContext({ a: true } as any, { sysconfig: 'invalid' } as any); }).toThrowError('Terafoundation requires a valid system configuration');
    });

    it('should throw an error when given an invalid application config', () => {
        expect(() => { singleContext('invalid' as any); }).toThrowError('Terafoundation requires a valid application configuration');
    });
});
