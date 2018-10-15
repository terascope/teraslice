'use strict';

const makeTerafoundationContext = require('../../../lib/workers/context/terafoundation-context');
const { newSysConfig } = require('../helpers');

describe('Terafoundation Context', () => {
    let context;

    beforeEach(() => {
        context = makeTerafoundationContext({ sysconfig: newSysConfig() });
    });

    it('should throw an error when given an invalid config', () => {
        expect(() => { makeTerafoundationContext({ sysconfig: 'hello' }); }).toThrowError('TerafoundationContext requires a valid terafoundation configuration');
    });

    it('should have the correct apis', () => {
        expect(context.apis.foundation).toHaveProperty('makeLogger');
        expect(context.foundation).toHaveProperty('makeLogger');
        expect(context.apis.foundation).toHaveProperty('getSystemEvents');
        expect(context.foundation).toHaveProperty('getEventEmitter');
        expect(context.apis.foundation).toHaveProperty('getConnection');
        expect(context.foundation).toHaveProperty('getConnection');
        expect(context.apis.foundation).toHaveProperty('startWorkers');
        expect(context.foundation).toHaveProperty('startWorkers');
        expect(context.apis).toHaveProperty('registerAPI');
    });

    it('should have the correct metadata', () => {
        const config = newSysConfig();
        expect(context).toHaveProperty('name', 'teraslice-worker');
        expect(context.sysconfig).toHaveProperty('teraslice');
        expect(context.sysconfig).toHaveProperty('terafoundation');
        expect(context.sysconfig.teraslice).toMatchObject(config.teraslice);
        expect(context.sysconfig).toHaveProperty('terafoundation');
        expect(context.sysconfig.terafoundation).toMatchObject(config.terafoundation);
        expect(context.cluster.worker).toHaveProperty('id');
    });


    it('should have a logger', () => {
        expect(context).toHaveProperty('logger');
    });
});
