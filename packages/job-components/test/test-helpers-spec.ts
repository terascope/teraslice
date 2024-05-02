import 'jest-extended';
import { EventEmitter } from 'events';
import {
    debugLogger,
    newTestJobConfig,
    newTestSlice,
    newTestExecutionContext,
    newTestExecutionConfig,
    TestContext,
} from '../src';

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

    it('should have a newTestExecutionContext (ExecutionController)', () => {
        expect(newTestExecutionConfig).toBeFunction();

        const exConfig = newTestExecutionConfig();
        const exContext = newTestExecutionContext('execution_controller', exConfig);
        expect(exContext.config).toEqual(exConfig);
        expect(exContext.reader).toBeNull();
        expect(exContext.slicer).toBeFunction();
    });

    it('should have a newTestExecutionContext (Worker)', () => {
        expect(newTestExecutionContext).toBeFunction();

        const exConfig = newTestExecutionConfig();
        const exContext = newTestExecutionContext('worker', exConfig);
        expect(exContext.config).toEqual(exConfig);
        expect(exContext.reader).toBeFunction();
        expect(exContext.slicer).toBeFunction();
    });

    it('should have a TestContext', () => {
        expect(TestContext).toBeTruthy();
        const context = new TestContext('test-name');
        expect(context).toHaveProperty('sysconfig');
        expect(context.sysconfig).toHaveProperty('_nodeName');
        expect(context).toHaveProperty('cluster');
        expect(context).toHaveProperty('apis');
        expect(context).toHaveProperty('foundation');
        expect(context.apis.foundation.getSystemEvents()).toBeInstanceOf(EventEmitter);
        expect(() => {
            context.apis.foundation.getConnection({
                endpoint: 'default',
                type: 'example',
            });
        }).toThrowError('No client was found for connection "example:default"');
        expect(context.apis.foundation.makeLogger()).toBeTruthy();
        expect(context.apis.foundation.makeLogger({ module: 'hi' })).toBeTruthy();
        expect(context.apis.foundation.makeLogger('hello')).toBeTruthy();

        const api = { there: () => 'peter' };
        expect(context.apis.registerAPI('hello', api)).toBeUndefined();
        expect(context.apis.hello.there()).toEqual('peter');
    });

    it('should be able to get and set clients', () => {
        const context = new TestContext('test-clients', {
            clients: [
                {
                    create() {
                        return { client: 'hello' };
                    },
                    type: 'test'
                }
            ]
        });

        expect(context.apis.getTestClients()).toEqual({});

        expect(context.apis.foundation.getConnection({
            type: 'test',
            endpoint: 'default'
        })).toEqual({ client: 'hello' });

        expect(context.apis.getTestClients()).toEqual({
            test: {
                default: {
                    client: 'hello'
                }
            }
        });

        context.apis.setTestClients([
            {
                create() {
                    return { client: 'howdy' };
                },
                type: 'test'
            }
        ]);

        expect(context.apis.getTestClients()).toEqual({});

        expect(context.apis.foundation.getConnection({
            type: 'test',
            endpoint: 'default'
        })).toEqual({ client: 'howdy' });

        expect(context.apis.getTestClients()).toEqual({
            test: {
                default: {
                    client: 'howdy'
                }
            }
        });
    });

    it('should be able to get and set async clients', async () => {
        const context = new TestContext('test-clients', {
            clients: [
                {
                    async createClient() {
                        return { client: 'hello' };
                    },
                    type: 'test'
                }
            ]
        });

        expect(context.apis.getTestClients()).toEqual({});

        const results = await context.apis.foundation.createClient({
            type: 'test',
            endpoint: 'default'
        });

        expect(results).toEqual({ client: 'hello' });
    });

    describe('MockPromMetrics', () => {
        const context = new TestContext('test-prom-metrics');
        context.sysconfig.teraslice.cluster_manager_type = 'kubernetes';
        context.sysconfig.terafoundation.prom_metrics_enabled = true;
        const config = {
            context,
            logger: debugLogger('test-helpers-spec-logger'),
            assignment: 'cluster-master'
        };

        it('should be able to init a mock prom_metrics_api', async () => {
            expect(await context.apis.foundation.promMetrics.init(config)).toBe(true);
            expect(context.apis.foundation.promMetrics.verifyAPI()).toBe(true);
        });

        it('should throw if API already initialized', async () => {
            await expect(context.apis.foundation.promMetrics.init(config)).rejects.toThrow('Prom metrics API cannot be initialized more than once.');
        });

        it('should add and delete metric', async () => {
            await context.apis.foundation.promMetrics.addMetric('test_counter', 'test_counter help string', ['uuid'], 'counter');
            expect(context.apis.foundation.promMetrics.hasMetric('test_counter')).toBe(true);
            expect(await context.apis.foundation.promMetrics.deleteMetric('test_counter')).toBe(true);
        });

        it('should inc, dec, and set metric', async () => {
            await context.apis.foundation.promMetrics.addMetric('test_gauge', 'test_gauge help string', ['uuid'], 'gauge');
            context.apis.foundation.promMetrics.set('test_gauge', { uuid: '437Ev89h' }, 10);
            context.apis.foundation.promMetrics.inc('test_gauge', { uuid: '437Ev89h' }, 1);
            context.apis.foundation.promMetrics.dec('test_gauge', { uuid: '437Ev89h' }, 2);
            expect(context.mockPromMetrics?.test_gauge.labels['uuid:437Ev89h,'].value).toBe(9);
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
            await context.apis.foundation.promMetrics.addSummary('test_summary', 'test_summary help string', ['uuid']);
            context.apis.foundation.promMetrics.observe('test_summary', { uuid: '34rhEqrX' }, 12);
            context.apis.foundation.promMetrics.observe('test_summary', { uuid: '34rhEqrX' }, 5);
            context.apis.foundation.promMetrics.observe('test_summary', { uuid: '34rhEqrX' }, 18);
            expect(context.mockPromMetrics?.test_summary?.labels['uuid:34rhEqrX,']).toEqual({ sum: 35, count: 3, value: 0 });
        });

        it('should add and observe histogram', async () => {
            await context.apis.foundation.promMetrics.addMetric('test_histogram', 'test_histogram help string', ['uuid'], 'histogram');
            context.apis.foundation.promMetrics.observe('test_histogram', { uuid: 'dEF4Kby6' }, 10);
            context.apis.foundation.promMetrics.observe('test_histogram', { uuid: 'dEF4Kby6' }, 30);
            context.apis.foundation.promMetrics.observe('test_histogram', { uuid: 'dEF4Kby6' }, 2);
            expect(context.mockPromMetrics?.test_histogram?.labels['uuid:dEF4Kby6,'])
                .toEqual({ sum: 42, count: 3, value: 0 });
        });

        it('should throw if observe called on metric that doesn\'t exist', async () => {
            expect(() => context.apis.foundation.promMetrics.observe('missing_test_histogram', { uuid: 'Hz4XpL9' }, 1))
                .toThrow('Metric missing_test_histogram is not setup');
        });

        it('should shutdown', async () => {
            await context.apis.foundation.promMetrics.shutdown();
            expect(context.mockPromMetrics).toBeNull();
        });
    });
});
