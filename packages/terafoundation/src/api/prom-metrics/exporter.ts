import promClient from 'prom-client';
import express, { Request, Response } from 'express';
import { Server } from 'http';
import { Logger } from '@terascope/utils';
import { FoundationContext, PromMetricsAPIConfig } from '../../interfaces';

export type CloseExporter = () => void;

export default class Exporter {
    private metricServer!: Server;
    logger: Logger;

    constructor(context: FoundationContext) {
        this.logger = context.apis.foundation.makeLogger({ module: 'prometheus_exporter' });
    }

    async create(
        promMetricsAPIConfig: PromMetricsAPIConfig
    ) {
        try {
            if (promMetricsAPIConfig.default_metrics) {
                const defaultMetricsConfig = {
                    prefix: promMetricsAPIConfig.prefix,
                    labels: promMetricsAPIConfig.labels
                };
                promClient.collectDefaultMetrics(defaultMetricsConfig);
            }
            const { port } = promMetricsAPIConfig;
            const app = express();
            app.get('/', async (_req: Request, res: Response) => {
                res.status(404).send('See the \'/metrics\' endpoint for the teraslice metric exporter\n');
            });

            app.get('/metrics', async (_req: Request, res: Response) => {
                res.set('Content-Type', promClient.register.contentType);
                res.end(await promClient.register.metrics());
            });

            this.metricServer = app.listen(port);
        } catch (err) {
            this.logger.error('Prometheus exporter creation failed: ', err);
        }
    }
    async shutdown() {
        this.metricServer.close();
    }

    async deleteMetric(name: string): Promise<void> {
        promClient.register.removeSingleMetric(name);
    }
}
