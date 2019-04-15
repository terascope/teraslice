'use strict';

const { SimpleContext } = require('..');

describe('Terafoundation (SimpleContext)', () => {
    it('should be able to return a valid context', () => {
        const context = new SimpleContext({
            name: 'example',
        });
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
    });
});
