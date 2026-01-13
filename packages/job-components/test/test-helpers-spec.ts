import 'jest-extended';
import { EventEmitter } from 'node:events';
import { debugLogger } from '@terascope/core-utils';
import {
    newTestJobConfig, newTestSlice, newTestExecutionConfig,
    TestContext,
} from '../src/index.js';

describe('Test Helpers', () => {
    it('should have a debugLogger', async () => {
        expect(debugLogger).toBeFunction();

        const logger = debugLogger('test-name');
        expect(logger).toHaveProperty('flush');
        expect(logger).toHaveProperty('info');
        expect(logger).toHaveProperty('debug');
        expect(logger).toHaveProperty('warn');
        expect(logger).toHaveProperty('error');
        expect(logger).toHaveProperty('trace');
        expect(logger).toHaveProperty('fatal');
        await logger.flush();
    });

    it('should have a newTestJobConfig', () => {
        expect(newTestJobConfig).toBeFunction();

        const jobConfig = newTestJobConfig({
            lifecycle: 'persistent',
        });

        expect(jobConfig).toHaveProperty('name', 'test-job');
        expect(jobConfig.lifecycle).toEqual('persistent');
        expect(jobConfig.operations).toBeArrayOfSize(0);
        expect(jobConfig.assets).toBeArrayOfSize(0);
    });

    it('should have a newTestExecutionConfig', () => {
        expect(newTestSlice).toBeFunction();

        const exConfig = newTestExecutionConfig({ probation_window: 100 });
        expect(exConfig).toHaveProperty('name', 'test-job');
        expect(exConfig.probation_window).toEqual(100);
        expect(exConfig.operations).toBeArrayOfSize(0);
        expect(exConfig.assets).toBeArrayOfSize(0);
    });

    it('should have a newTestSlice', () => {
        expect(newTestSlice).toBeFunction();

        const slice = newTestSlice({ hello: true });
        expect(slice).toHaveProperty('slice_id');
        expect(slice.slice_id).toBeString();
        expect(slice).toHaveProperty('slicer_id');
        expect(slice.slicer_id).toBeNumber();
        expect(slice).toHaveProperty('slicer_order');
        expect(slice.slicer_order).toBeNumber();
        expect(slice).toHaveProperty('request');
        expect(slice.request).toEqual({ hello: true });
        expect(slice).toHaveProperty('_created');
        expect(slice._created).toBeString();
    });

    it('should have a TestContext', () => {
        expect(TestContext).toBeTruthy();
        const context = new TestContext('test-name');
        expect(context).toHaveProperty('sysconfig');
        expect(context.sysconfig).toHaveProperty('_nodeName');
        expect(context).toHaveProperty('cluster');
        expect(context).toHaveProperty('apis');
        expect(context.apis.foundation.getSystemEvents()).toBeInstanceOf(EventEmitter);
        expect(context.apis.foundation.makeLogger()).toBeTruthy();
        expect(context.apis.foundation.makeLogger({ module: 'hi' })).toBeTruthy();
        expect(context.apis.foundation.makeLogger({ hello: 'world' })).toBeTruthy();

        const api = { there: () => 'peter' };
        expect(context.apis.registerAPI('hello', api)).toBeUndefined();
        expect(context.apis.hello.there()).toEqual('peter');
    });

    it('should be able to get and set clients', async () => {
        const logger = debugLogger('test-name');
        const context = new TestContext('test-clients', {
            clients: [
                {
                    async createClient() {
                        return { client: 'hello', logger };
                    },
                    type: 'test'
                }
            ]
        });

        expect(context.apis.getTestClients()).toEqual({});

        const result = await context.apis.foundation.createClient({
            type: 'test',
            endpoint: 'default'
        });

        expect(result).toHaveProperty('client');
        expect(result).toHaveProperty('logger');

        expect(result.client).toEqual('hello');

        context.apis.setTestClients([
            {
                async createClient() {
                    return { client: 'howdy', logger };
                },
                type: 'test'
            }
        ]);

        expect(context.apis.getTestClients()).toEqual({});

        const result2 = await context.apis.foundation.createClient({
            type: 'test',
            endpoint: 'default'
        });

        expect(result2).toHaveProperty('client');
        expect(result2).toHaveProperty('logger');

        expect(result2.client).toEqual('howdy');

        const results3 = context.apis.getTestClients();

        expect(results3).toHaveProperty('test');
        expect(results3).toHaveProperty('test.default');
        expect(results3).toHaveProperty('test.default.client');
        expect(results3).toHaveProperty('test.default.logger');
        expect(results3.test.default.client).toEqual('howdy');
    });

    describe('MockPromMetrics', () => {
        const context = new TestContext('test-prom-metrics');
        context.sysconfig.teraslice.cluster_manager_type = 'kubernetesV2';
        const config = {
            terasliceName: context.sysconfig.teraslice.name,
            assignment: 'master',
            logger: debugLogger('test-helpers-spec-logger'),
            tf_prom_metrics_enabled: true,
            tf_prom_metrics_port: 3333,
            tf_prom_metrics_add_default: false,
            prom_metrics_display_url: 'http://localhost'
        };

        it('should be able to init a mock prom_metrics_api', async () => {
            expect(await context.apis.foundation.promMetrics.init(config)).toBe(true);
            expect(context.apis.foundation.promMetrics.verifyAPI()).toBe(true);
        });

        it('should throw if API already initialized', async () => {
            await expect(context.apis.foundation.promMetrics.init(config)).rejects.toThrow('Prom metrics API cannot be initialized more than once.');
        });

        it('should add, inc and delete counter', async () => {
            await context.apis.foundation.promMetrics.addCounter('test_counter', 'test_counter help string', ['uuid', 'name'], function collect() {
                this.inc({ uuid: 'e&vgv%56' }, 1);
            });
            context.apis.foundation.promMetrics.inc('test_counter', { uuid: 'e&vgv%56' }, 1);
            expect(context.apis.foundation.promMetrics.hasMetric('test_counter')).toBe(true);
            expect(await context.apis.foundation.promMetrics.deleteMetric('test_counter')).toBe(true);
        });

        it('should inc, dec, and set gauge', async () => {
            await context.apis.foundation.promMetrics.addGauge('test_gauge', 'help string', ['uuid', 'name']);
            context.apis.foundation.promMetrics.set('test_gauge', { uuid: '437Ev89h' }, 10);
            context.apis.foundation.promMetrics.inc('test_gauge', { uuid: '437Ev89h' }, 1);
            context.apis.foundation.promMetrics.dec('test_gauge', { uuid: '437Ev89h' }, 2);
            const metrics: string = await context.apis.scrapePromMetrics();
            const sum = metrics.split('\n').filter((line) => line.includes('437Ev89h'))[0].split(' ')[1];
            expect(sum).toBe('9');
        });

        it('should throw if inc called on metric that doesn\'t exist', async () => {
            expect(() => context.apis.foundation.promMetrics.inc('missing_test_gauge', { uuid: 'fg7HUI5' }, 1))
                .toThrow('Metric missing_test_gauge is not setup');
        });

        it('should throw if dec called on metric that doesn\'t exist', async () => {
            expect(() => context.apis.foundation.promMetrics.dec('missing_test_gauge', { uuid: 'fg7HUI5' }, 1))
                .toThrow('Metric missing_test_gauge is not setup');
        });

        it('should throw if set called on metric that doesn\'t exist', async () => {
            expect(() => context.apis.foundation.promMetrics.set('missing_test_gauge', { uuid: 'fg7HUI5' }, 1))
                .toThrow('Metric missing_test_gauge is not setup');
        });
        it('should add and observe summary', async () => {
            await context.apis.foundation.promMetrics.addSummary('test_summary', 'test_summary help string', ['uuid', 'name']);
            context.apis.foundation.promMetrics.observe('test_summary', { uuid: '34rhEqrX' }, 12);
            context.apis.foundation.promMetrics.observe('test_summary', { uuid: '34rhEqrX' }, 5);
            context.apis.foundation.promMetrics.observe('test_summary', { uuid: '34rhEqrX' }, 18);
            const metrics: string = await context.apis.scrapePromMetrics();
            const sum = metrics.split('\n').filter((line) => line.includes('test_summary_sum'))[0].split(' ')[1];
            const count = metrics.split('\n').filter((line) => line.includes('test_summary_count'))[0].split(' ')[1];
            expect(sum).toBe('35');
            expect(count).toBe('3');
        });

        it('should add and observe histogram', async () => {
            await context.apis.foundation.promMetrics.addHistogram('test_histogram', 'test_histogram help string', ['uuid', 'name']);
            context.apis.foundation.promMetrics.observe('test_histogram', { uuid: 'dEF4Kby6' }, 10);
            context.apis.foundation.promMetrics.observe('test_histogram', { uuid: 'dEF4Kby6' }, 30);
            context.apis.foundation.promMetrics.observe('test_histogram', { uuid: 'dEF4Kby6' }, 2);
            const metrics: string = await context.apis.scrapePromMetrics();
            const sum = metrics.split('\n').filter((line) => line.includes('test_histogram_sum'))[0].split(' ')[1];
            const count = metrics.split('\n').filter((line) => line.includes('test_histogram_count'))[0].split(' ')[1];
            expect(sum).toBe('42');
            expect(count).toBe('3');
        });

        it('should throw if observe called on metric that doesn\'t exist', async () => {
            expect(() => context.apis.foundation.promMetrics.observe('missing_test_histogram', { uuid: 'Hz4XpL9' }, 1))
                .toThrow('Metric missing_test_histogram is not setup');
        });

        it('should reset metrics', () => {
            context.apis.foundation.promMetrics.resetMetrics();
            expect(context.mockPromMetrics?.metricList).toBeEmptyObject();
        });

        it('should shutdown', async () => {
            await context.apis.foundation.promMetrics.shutdown();
            expect(context.mockPromMetrics).toBeNull();
        });
    });
});
