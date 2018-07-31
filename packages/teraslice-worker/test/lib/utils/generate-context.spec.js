'use strict';

const { generateContext } = require('../../../lib/utils/context');
const { newSysConfig } = require('../../helpers');

describe('Terafoundation Context', () => {
    let context;

    beforeEach(() => {
        context = generateContext(newSysConfig());
    });

    it('should throw an error when given no config', () => {
        expect(() => { generateContext(); }).toThrowError('Worker requires a valid terafoundation configuration');
    });

    it('should throw an error when given an invalid config', () => {
        expect(() => { generateContext('hello'); }).toThrowError('Worker requires a valid terafoundation configuration');
    });

    it('should have the correct apis', () => {
        expect(context.apis.foundation).toHaveProperty('makeLogger');
        expect(context.foundation).toHaveProperty('makeLogger');
        expect(context.apis.foundation).toHaveProperty('getSystemEvents');
        expect(context.foundation).toHaveProperty('getEventEmitter');
        expect(context.apis.foundation).toHaveProperty('getConnection');
        expect(context.foundation).toHaveProperty('getConnection');
        expect(context.apis.foundation).not.toHaveProperty('startWorkers');
        expect(context.foundation).not.toHaveProperty('startWorkers');
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
