import 'jest-extended';
import got from 'got';
import { Counter } from 'prom-client';
import { debugLogger } from '@terascope/core-utils';
import { Terafoundation as tf } from '@terascope/types';
import Exporter from '../../src/api/prom-metrics/exporter.js';

describe('prometheus exporter', () => {
    let exporter: Exporter;

    async function getExporterMetrics(): Promise<string> {
        const response: Record<string, any> = await got('http://127.0.0.1:3344/metrics', {
            throwHttpErrors: true
        });
        return response.body;
    }

    beforeAll(() => {
        const logger = debugLogger('prometheus_exporter');
        exporter = new Exporter(logger);
    });

    describe('create', () => {
        const config: tf.PromMetricsAPIConfig = {
            assignment: 'worker',
            port: 3344,
            default_metrics: false,
            labels: {
                ex_id: '12345',
                job_id: '67890',
                job_name: 'test-exporter',
            },
            prefix: 'prefix'
        };
        it('should make an express server', async () => {
            await exporter.create(config);
            const response: Record<string, any> = await got('http://127.0.0.1:3344/metrics', {
                throwHttpErrors: true
            });
            expect(response.body).toBeString();
        });
    });

    describe('delete', () => {
        it('should delete a metric', async () => {
            new Counter({
                name: 'delete_test',
                help: 'delete_test_help_message',
                labelNames: ['delete_test_label'],
            });

            const bodyBefore = await getExporterMetrics();
            const valueBefore = bodyBefore.split('\n').filter((line: string) => line.includes('delete_test counter'))[0];
            expect(valueBefore).toBe('# TYPE delete_test counter');

            await exporter.deleteMetric('delete_test');
            const bodyAfter = await getExporterMetrics();
            const valueAfter = bodyAfter.split('\n').filter((line: string) => line.includes('delete_test counter'))[0];
            expect(valueAfter).toBe(undefined);
        });
    });

    describe('reset', () => {
        it('should reset the prom metrics registry', async () => {
            const counter = new Counter({
                name: 'reset_test',
                help: 'reset_test_help_message',
                labelNames: ['reset_test_label'],
            });

            counter.inc(100);
            const bodyBefore = await getExporterMetrics();
            expect(bodyBefore).toInclude('reset_test 100');

            exporter.resetMetrics();
            const bodyAfter = await getExporterMetrics();
            expect(bodyAfter).not.toInclude('reset_test 100');
        });
    });

    describe('shutdown', () => {
        it('should shutdown the express server', async () => {
            await exporter.shutdown();
            await expect(() => got('http://127.0.0.1:3344/metrics', {
                throwHttpErrors: true
            })).rejects.toThrow('connect ECONNREFUSED 127.0.0.1:3344');
        });
    });
});
