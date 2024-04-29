import { Logger } from '@terascope/utils';

import os from 'os';
import {
    Gauge, Counter, Histogram, Summary
} from 'prom-client';
import * as i from '../../interfaces';

import Exporter from './exporter';

export class PromMetrics {
    readonly metricList!: i.MetricList;

    default_labels!: Record<string, string>;
    prefix: string;
    private metricExporter!: Exporter;
    context: i.FoundationContext;
    apiConfig: i.PromMetricsAPIConfig;
    apiRunning: boolean;
    logger: Logger;

    constructor(
        context: i.FoundationContext,
        logger: Logger,
    ) {
        this.context = context;
        this.apiRunning = false;
        /// These are initialized here but are overwritten in init()
        this.apiConfig = {} as i.PromMetricsAPIConfig;
        this.prefix = '';
        this.logger = logger.child({ module: 'prom_metrics' });
        this.metricList = {};
    }

    async init(config: i.PromMetricsInitConfig) {
        const { terafoundation, teraslice } = config.context.sysconfig;
        const metricsEnabledInTF = terafoundation.prom_metrics_enabled;
        const portToUse = config.port || terafoundation.prom_metrics_port;

        if (teraslice.cluster_manager_type === 'native') {
            this.logger.warn('Skipping PromMetricsAPI initialization: incompatible with native clustering.');
            return false;
        }

        // PromMetricsAPIConfig overrides terafoundation. This allows jobs to set
        // different metrics configurations than the master.
        // If prom_metrics_add_default is defined in jobSpec use that value.
        // If not use the terafoundation value.
        const useDefaultMetrics = config.default_metrics !== undefined
            ? config.default_metrics
            : terafoundation.prom_metrics_add_default;

        // If prom_metrics_enabled is true in jobConfig, or if not specified in
        // jobSpec and true in terafoundation, then we enable metrics.
        if (config.metrics_enabled_by_job === true
        || (config.metrics_enabled_by_job === undefined && metricsEnabledInTF)) {
            const apiConfig: i.PromMetricsAPIConfig = {
                assignment: config.assignment,
                port: portToUse,
                default_metrics: useDefaultMetrics,
                labels: config.labels,
                prefix: config.prefix
            };

            this.prefix = apiConfig.prefix || `teraslice_${apiConfig.assignment}_`;

            this.default_labels = {
                name: this.context.sysconfig.teraslice.name,
                assignment: apiConfig.assignment,
                ...apiConfig.labels
            };
            await this.createAPI(apiConfig);
            return true;
        }
        this.logger.warn('Cannot create PromMetricsAPI because metrics are disabled.');
        return false;
    }

    /**
     * [set metric to value]
     * @param  {string} name [metric name]
     * @param  {Record<string, string>} labels [list of labels and labels values]
     * @param  {number} value [metric value]
     * @return {void}
     */
    set(name: string, labels: Record<string, string>, value: number): void {
        const metric = this.metricList[name];
        if (!metric.functions || !metric.metric) {
            throw new Error(`Metric ${name} is not setup`);
        }
        if (metric.functions.has('set')) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            const res = metric.metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            ));
            // @ts-expect-error FIXME the types are wrong here
            res.set(value);
        } else {
            throw new Error(`set not available on ${name} metric`);
        }
    }

    /**
     * [increment metric by value]
     * @param  {string} name [metric name]
     * @param  {Record<string, string>} labels [list of labels and labels values]
     * @param  {number} value [metric value, default = 1]
     * @return {void}
     */
    inc(name: string, labels: Record<string, string>, value = 1): void {
        const metric = this.metricList[name];
        if (!metric.functions || !metric.metric) {
            throw new Error(`Metric ${name} is not setup`);
        }

        if (metric.functions.has('inc')) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            const res = metric.metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            ));
            // @ts-expect-error FIXME the types are wrong here
            res.inc(value);
        } else {
            throw new Error(`inc not available on ${name} metric`);
        }
    }

    /**
     * [decrement metric by value]
     * @param  {string} name [metric name]
     * @param  {Record<string, string>} labels [list of labels and labels values]
     * @param  {number} value [metric value, default = 1]
     * @return {void}
     */
    dec(name: string, labels: Record<string, string>, value = 1): void {
        const metric = this.metricList[name];
        if (!metric.functions || !metric.metric) {
            throw new Error(`Metric ${name} is not setup`);
        }

        if (metric.functions.has('dec')) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            const res = metric.metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            ));
            // @ts-expect-error FIXME the types are wrong here
            res.dec(value);
        } else {
            throw new Error(`dec not available on ${name} metric`);
        }
    }
    /**
     * [observe value, used by summary metric type]
     * @param  {string} name [metric name]
     * @param  {Array<string, string>} labels [list of labels and labels values]
     * @param  {number} value [metric value]
     * @return {void}
     */
    observe(name: string, labels: Record<string, string>, value: number): void {
        const metric = this.metricList[name];
        if (!metric.functions || !metric.metric) {
            throw new Error(`Metric ${name} is not setup`);
        }

        if (metric.functions.has('observe')) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            const res = metric.metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            ));
            // @ts-expect-error FIXME the types are wrong here
            res.observe(value);
        } else {
            throw new Error(`observe not available on ${name} metric`);
        }
    }

    /**
     * [addMetric (define) new metric]
     * @param  {string} name [metric name]
     * @param  {string} help [metric help]
     * @param  {Array<string>} labelsNames [list of label names]
     * @param  {'gauge' | 'counter' | 'histogram'} type [gauge,counter,histogram,or summary]
     * @param  {Array<number>} buckets [default buckets]
     * @return {void}
     */
    async addMetric(
        name: string,
        help: string,
        labelsNames: Array<string>,
        type: 'gauge' | 'counter' | 'histogram',
        buckets: Array<number> = [0.1, 5, 15, 50, 100, 500]
    ): Promise<void> {
        if (!this.hasMetric(name)) {
            const fullname = this.prefix + name;
            if (type === 'gauge') {
                this.metricList[name] = this._createGaugeMetric(
                    fullname, help, labelsNames.concat(Object.keys(this.default_labels))
                );
            }
            if (type === 'counter') {
                this.metricList[name] = this._createCounterMetric(
                    fullname, help, labelsNames.concat(Object.keys(this.default_labels))
                );
            }
            if (type === 'histogram') {
                this.metricList[name] = this._createHistogramMetric(
                    fullname, help, labelsNames.concat(Object.keys(this.default_labels)), buckets
                );
            }
        } else {
            this.logger.info(`metric ${name} already defined in metric list`);
        }
    }

    /**
     * [hasMetric check if metricList contains metric]
     * @param  {string} name [metric name]
     * @return {boolean}
     */

    hasMetric(name: string): boolean {
        return (name in this.metricList);
    }

    /**
     * [deleteMetric delete metric from metricList]
     * @param  {string} name [metric name]
     * @return {Promise<boolean>} [was the metric successfully deleted]
     */
    async deleteMetric(name: string): Promise<boolean> {
        let deleted = false;
        const fullname = this.prefix + name;
        this.logger.info(`delete metric ${fullname}`);
        if (this.hasMetric(name)) {
            deleted = delete this.metricList[name]; // fixme
            try {
                await this.metricExporter.deleteMetric(fullname);
            } catch (err) {
                deleted = false;
                throw new Error(`unable to delete metric ${fullname} from exporter`);
            }
        } else {
            throw new Error(`metric ${name} not defined in metric list`);
        }
        return deleted;
    }

    /**
     * [addSummary (define) new summary metric]
     * @param  {string} name [metric name]
     * @param  {string} help [metric help]
     * @param  {Array<string>} labelsNames [list of label names]
     * @param  {Array<number>} percentiles [metric percentiles, default[0.01, 0.1, 0.9, 0.99] ]
     * @param  {number} maxAgeSeconds [how old a bucket can be before it is reset ]
     * @param  {number} ageBuckets [how many buckets for sliding window ]
     * @return {Promise<void>}
     */
    async addSummary(name: string,
        help: string,
        labelsNames: Array<string>,
        maxAgeSeconds = 600,
        ageBuckets = 5,
        percentiles: Array<number> = [0.01, 0.1, 0.9, 0.99]
    ): Promise<void> {
        if (!(name in this.metricList)) {
            const fullname = this.prefix + name;
            this.metricList[name] = this._createSummaryMetric(
                fullname,
                help,
                labelsNames.concat(Object.keys(this.default_labels)),
                percentiles,
                maxAgeSeconds,
                ageBuckets
            );
        }
    }

    private _createGaugeMetric(name: string, help: string,
        labelsNames: Array<string>): any {
        const gauge = new Gauge({
            name,
            help,
            labelNames: labelsNames,
        });
        return { name, metric: gauge, functions: new Set(['inc', 'dec', 'set']) };
    }

    private _createCounterMetric(name: string, help: string,
        labelsNames: Array<string>): any {
        const counter = new Counter({
            name,
            help,
            labelNames: labelsNames,
        });
        return { name, metric: counter, functions: new Set(['inc']) };
    }

    private _createHistogramMetric(name: string, help: string, labelsNames: Array<string>,
        buckets: Array<number>): any {
        const histogram = new Histogram({
            name,
            help,
            labelNames: labelsNames,
            buckets
        });
        return { name, metric: histogram, functions: new Set(['observe']) };
    }

    private _createSummaryMetric(name: string, help: string, labelsNames: Array<string>,
        percentiles: Array<number>, ageBuckets: number, maxAgeSeconds: number): any {
        const histogram = new Summary({
            name,
            help,
            labelNames: labelsNames,
            percentiles,
            maxAgeSeconds,
            ageBuckets
        });
        return { name, metric: histogram, functions: new Set(['observe']) };
    }

    private _setPodName(): void {
        // in a pod the hostname is the pod name
        const host = os.hostname();
        if (host.startsWith('ts-wkr-')) {
            this.default_labels.pod_name = host;
        }
    }

    private async createAPI(apiConfig: i.PromMetricsAPIConfig) {
        this._setPodName();
        try {
            if (!this.metricExporter) {
                apiConfig.labels = Object.assign(
                    {},
                    apiConfig.labels,
                    this.default_labels
                );
                this.metricExporter = new Exporter(this.logger);
                await this.metricExporter.create(apiConfig);
                this.logger.info(`prom_metrics_API exporter created on port ${apiConfig.port}`);
            }
        } catch (err) {
            this.logger.info('prom_metrics_API exporter already running');
            this.logger.error(err);
        }
        this.apiRunning = true;
    }

    verifyAPI(): boolean {
        return this.apiRunning;
    }

    async shutdown(): Promise<void> {
        this.logger.info('prom_metrics_API exporter shutdown');
        try {
            await this.metricExporter.shutdown();
            this.apiRunning = false;
        } catch (err) {
            this.logger.error(`shutting down metric exporter ${err}`);
        }
    }
}
