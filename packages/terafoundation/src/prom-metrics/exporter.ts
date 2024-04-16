import promClient from 'prom-client';
import express, { Request, Response } from 'express';
import { Server } from 'http';
import { PromMetricAPIConfig } from './interfaces';

export type CloseExporter = () => void;

export default class Exporter {
    private metricServer!: Server;

    async create(
        promMetricApiConfig: PromMetricAPIConfig
    ) {
        if (promMetricApiConfig.default_metrics) {
            promClient.collectDefaultMetrics();
        }
        const { port } = promMetricApiConfig;
        const app = express();
        app.get('/', async (_req: Request, res: Response) => {
            res.status(404).send('See the \'/metrics\' endpoint for the teraslice metric exporter\n');
        });

        app.get('/metrics', async (_req: Request, res: Response) => {
            res.set('Content-Type', promClient.register.contentType);
            res.end(await promClient.register.metrics());
        });

        this.metricServer = app.listen(port);
    }
    async shutdown() {
        this.metricServer.close();
    }

    async deleteMetric(name: string): Promise<void> {
        promClient.register.removeSingleMetric(name);
    }
}
