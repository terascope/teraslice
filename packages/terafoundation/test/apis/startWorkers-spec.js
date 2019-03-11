'use strict';

const { debugLogger } = require('@terascope/utils');
const api = require('../../lib/api');

describe('startWorkers foundation API', () => {
    const context = {
        sysconfig: {
            terafoundation: {
                log_level: 'debug'
            }
        },
        name: 'terafoundation'
    };

    beforeEach(() => {
        // This sets up the API endpoints in the context.
        api(context);
        context.cluster = {
            isMaster: true,
            fork: jasmine.createSpy('cluster-fork')
        };
        context.logger = debugLogger('terafondation-tests');
    });

    it('should call fork to create a worker', () => {
        const { foundation } = context.apis;
        const { fork } = context.cluster;
        foundation.startWorkers(1);

        expect(fork).toHaveBeenCalledWith({
            assignment: 'worker',
            service_context: '{"assignment":"worker"}'
        });
    });

    it('should call fork to create a worker with environment', () => {
        const { foundation } = context.apis;
        const { fork } = context.cluster;
        foundation.startWorkers(1, { myoption: 'myoption' });

        expect(fork).toHaveBeenCalledWith({
            assignment: 'worker',
            service_context: '{"myoption":"myoption"}',
            myoption: 'myoption'
        });
    });

    it('fork should not be called if this is not the master', () => {
        const { foundation } = context.apis;
        const { fork } = context.cluster;
        context.cluster.isMaster = false;

        foundation.startWorkers(1, { myoption: 'myoption' });

        expect(fork.calls.count()).toBe(0);
    });

    it('should call fork 10 times to create 10 workers', () => {
        const { foundation } = context.apis;
        const { fork } = context.cluster;
        foundation.startWorkers(10);

        expect(fork.calls.count()).toBe(10);
    });
});
