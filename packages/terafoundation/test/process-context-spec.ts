import 'jest-extended';
import { ProcessContext } from '../src/index.js';

describe('Terafoundation (ProcessContext)', () => {
    it('should be able to return a valid context', async () => {
        const context = new ProcessContext({
            name: 'example',
        } as any );

        await context.init({
            configfile: {
                terafoundation: {
                    environment: process.env.NODE_ENV,
                }
            }
        } as any)
        expect(context).toHaveProperty('assignment');
        expect(context).toHaveProperty('name', 'example');
        expect(context).toHaveProperty('cluster.worker.id');
        expect(context).toHaveProperty('logger');
        expect(context).toHaveProperty('arch', process.arch);
        expect(context).toHaveProperty('platform', process.platform);
        expect(context).toHaveProperty('sysconfig._nodeName');
        expect(context).toHaveProperty('apis.foundation.startWorkers');
        expect(context).toHaveProperty('apis.foundation.makeLogger');
        expect(context).toHaveProperty('apis.foundation.getSystemEvents');

        context.apis.foundation.getSystemEvents().removeAllListeners();
    });

    it('should throw an error when given an invalid system config', async() => {
        await expect(async () => {
            const context = new ProcessContext({
                a: 'true',
            } as any );

            return context.init({
                configfile: 'invalid'
            } as any)
        }).rejects.toThrowError('Terafoundation requires a valid system configuration');
    });

    it('should throw an error when given an invalid application config', async () => {
        await expect(async () => {
            const context = new ProcessContext('invalid' as any);
            await context.init({} as any)
        }).rejects.toThrowError('Terafoundation requires a valid application configuration');
    });
});
