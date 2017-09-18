'use strict';

const fakeLogger = require('../helpers/fakeLogger');

const context = {
    sysconfig: {
        terafoundation: {
            log_level: 'debug'
        }
    },
    name: 'terafoundation'
};

// This sets up the API endpoints in the context.
require('../../lib/api')(context);

describe('startWorkers foundation API', () => {
    const foundation = context.apis.foundation;
    let forkSpy;

    beforeEach(() => {
        forkSpy = jasmine.createSpy('cluster-fork');

        context.cluster = {
            isMaster: true,
            fork: forkSpy
        };
        context.logger = fakeLogger;
    });

    it('should call fork to create a worker', () => {
        foundation.startWorkers(1);

        expect(forkSpy).toHaveBeenCalledWith({
            assignment: 'worker',
            service_context: '{"assignment":"worker"}'
        });
    });

    it('should call fork to create a worker with environment', () => {
        foundation.startWorkers(1, { myoption: 'myoption' });

        expect(forkSpy).toHaveBeenCalledWith({
            assignment: 'worker',
            service_context: '{"myoption":"myoption"}',
            myoption: 'myoption'
        });
    });

    it('fork should not be called if this is not the master', () => {
        context.cluster.isMaster = false;

        foundation.startWorkers(1, { myoption: 'myoption' });

        expect(forkSpy.calls.count()).toBe(0);
    });

    it('should call fork 10 times to create 10 workers', () => {
        foundation.startWorkers(10);

        expect(forkSpy.calls.count()).toBe(10);
    });
});
