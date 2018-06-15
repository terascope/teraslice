'use strict';

const Promise = require('bluebird');
const events = require('events');

const eventEmitter = new events.EventEmitter();

describe('execution_analytics', () => {
    const executionAnalyticsModule = require('../../lib/cluster/execution_controller/execution_analytics');

    let msgHandler;
    let msgResponse;
    let msgSent;

    function waitFor(time) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(true), time);
        });
    }

    const logger = {
        error() {},
        info() {},
        warn() {},
        trace() {},
        debug() {}
    };
    const context = {
        sysconfig: { teraslice: { analytics_rate: 10 } },
        apis: {
            foundation: {
                makeLogger: () => logger,
                getSystemEvents: () => eventEmitter
            }
        }
    };

    const messaging = {
        register: (msgEvt) => {
            msgHandler = msgEvt;
        },
        respond: (incomingMsg, outgoingMsg) => {
            msgResponse = outgoingMsg;
        },
        send: (obj) => {
            msgSent = obj;
        },
        listen: () => Promise.resolve()
    };

    it('can instantiate', () => {
        const executionAnalytics = executionAnalyticsModule(context, messaging);

        expect(executionAnalytics).toBeDefined();
        expect(executionAnalytics.set).toBeDefined();
        expect(executionAnalytics.increment).toBeDefined();
        expect(executionAnalytics.getAnalytics).toBeDefined();
        expect(executionAnalytics.shutdown).toBeDefined();

        expect(typeof executionAnalytics.set).toEqual('function');
        expect(typeof executionAnalytics.increment).toEqual('function');
        expect(typeof executionAnalytics.getAnalytics).toEqual('function');
        expect(typeof executionAnalytics.shutdown).toEqual('function');

        executionAnalytics.shutdown();
    });

    it('can return analytics', () => {
        const executionAnalytics = executionAnalyticsModule(context, messaging);
        const data = executionAnalytics.getAnalytics();

        expect(data.workers_available).toBeDefined();
        expect(data.workers_active).toBeDefined();
        expect(data.workers_joined).toBeDefined();
        expect(data.workers_reconnected).toBeDefined();
        expect(data.workers_disconnected).toBeDefined();
        expect(data.failed).toBeDefined();
        expect(data.subslices).toBeDefined();
        expect(data.queued).toBeDefined();
        expect(data.slice_range_expansion).toBeDefined();
        expect(data.processed).toBeDefined();
        expect(data.slicers).toBeDefined();
        expect(data.subslice_by_key).toBeDefined();
        expect(data.started).toBeDefined();

        executionAnalytics.shutdown();
    });

    it('can increment values', () => {
        const executionAnalytics = executionAnalyticsModule(context, messaging);
        executionAnalytics.increment('workers_available');
        executionAnalytics.increment('workers_available');
        executionAnalytics.increment('failed');

        const data = executionAnalytics.getAnalytics();

        expect(data.workers_available).toEqual(2);
        expect(data.failed).toEqual(1);

        executionAnalytics.shutdown();
    });

    it('can set values', () => {
        const executionAnalytics = executionAnalyticsModule(context, messaging);
        executionAnalytics.set('workers_active', 5);
        executionAnalytics.set('queued', 15);

        const data = executionAnalytics.getAnalytics();

        expect(data.workers_active).toEqual(5);
        expect(data.queued).toEqual(15);

        executionAnalytics.shutdown();
    });

    it('can listen for slicer events', () => {
        const executionAnalytics = executionAnalyticsModule(context, messaging);
        eventEmitter.emit('slicer:slice:recursion');
        eventEmitter.emit('slicer:slice:recursion');

        const data = executionAnalytics.getAnalytics();
        expect(data.subslices).toEqual(2);

        executionAnalytics.shutdown();
    });

    it('registers an event handler which sends analytics data to cluster master', () => {
        const beforeExID = process.env.ex_id;
        const beforeJobID = process.env.job_id;
        const beforeJob = process.env.job;

        process.env.ex_id = 123;
        process.env.job_id = 456;
        process.env.job = JSON.stringify({ name: 'test' });

        const executionAnalytics = executionAnalyticsModule(context, messaging);
        const incomingMsg = { __msgId: 1234, __source: 'testing', node_id: 'someNode' };
        expect(msgHandler.event).toEqual('cluster:slicer:analytics');
        expect(typeof msgHandler.callback).toEqual('function');

        msgHandler.callback(incomingMsg);

        expect(msgResponse.node_id).toEqual(incomingMsg.node_id);
        expect(msgResponse.ex_id).toEqual('123');
        expect(msgResponse.job_id).toEqual('456');
        expect(msgResponse.payload.name).toEqual('test');
        expect(msgResponse.payload.stats).toBeDefined();
        expect(typeof msgResponse.payload.stats).toEqual('object');

        executionAnalytics.shutdown();
        // other tests use these variables so need to return them to what they where
        process.env.ex_id = beforeExID;
        process.env.job_id = beforeJobID;
        process.env.job = beforeJob;
    });

    it('will sent analytic updates periodically', (done) => {
        const executionAnalytics = executionAnalyticsModule(context, messaging);

        waitFor(12)
            .then(() => {
                expect(msgSent.to).toEqual('cluster_master');
                expect(msgSent.message).toEqual('cluster:analytics');
                expect(msgSent.payload).toBeDefined();
                expect(typeof msgSent.payload).toEqual('object');
                expect(msgSent.payload.kind).toEqual('slicer');

                expect(msgSent.to).toEqual('cluster_master');
                expect(msgSent.payload.stats.workers_joined).toEqual(0);
                expect(msgSent.payload.stats.processed).toEqual(0);

                executionAnalytics.increment('workers_joined');
                executionAnalytics.increment('processed');
                // using shutdown flushes the pushed analytics
                return Promise.all([waitFor(12), executionAnalytics.shutdown()]);
            })
            .then(() => {
                expect(msgSent.payload.stats.workers_joined).toEqual(1);
                expect(msgSent.payload.stats.processed).toEqual(1);
            })
            .finally(() => {
                executionAnalytics.shutdown();
                done();
            });
    });
});
