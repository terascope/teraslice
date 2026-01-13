import { Logger } from '@terascope/core-utils';
import os from 'node:os';
import {
    Gauge, Counter, Histogram, Summary,
    CollectFunction
} from 'prom-client';
import { Terafoundation as tf } from '@terascope/types';
import Exporter from './exporter.js';

export class PromMetrics {
    readonly metricList!: tf.MetricList;

    default_labels!: Record<string, string>;
    prefix: string;
    private metricExporter!: Exporter;
    apiConfig: tf.PromMetricsAPIConfig;
    apiRunning: boolean;
    logger: Logger;

    constructor(
        logger: Logger,
    ) {
        this.apiRunning = false;
        this.apiConfig = {} as tf.PromMetricsAPIConfig;
        this.prefix = '';
        this.logger = logger.child({ module: 'prom_metrics' });
        this.metricList = {};
    }

    /**
     * Initialize the promMetrics API and create an exporter server. Will not initialize a new API
     * if in native clustering or if the API has already been initialized.
     * @param {i.PromMetricsInitConfig} config PromMetricsInitConfig values override those
     * of terafoundation. This allows jobs to set different metrics configurations than the master.
     * @returns {Promise<boolean>} Was the API initialized
     */
    async init(config: tf.PromMetricsInitConfig) {
        if (this.apiRunning) {
            throw new Error('Prom metrics API cannot be initialized more than once.');
        }
        const {
            assignment, job_prom_metrics_add_default, job_prom_metrics_enabled,
            job_prom_metrics_port, tf_prom_metrics_add_default, tf_prom_metrics_enabled,
            tf_prom_metrics_port, labels, prefix, terasliceName, prom_metrics_display_url
        } = config;

        const portToUse = job_prom_metrics_port || tf_prom_metrics_port;

        const useDefaultMetrics = job_prom_metrics_add_default !== undefined
            ? job_prom_metrics_add_default
            : tf_prom_metrics_add_default;

        // If job_prom_metrics_enabled is true, or if not specified and
        // tf_prom_metrics_enabled is true, then we enable metrics.
        if (job_prom_metrics_enabled === true
            || (job_prom_metrics_enabled === undefined && tf_prom_metrics_enabled)) {
            const apiConfig: tf.PromMetricsAPIConfig = {
                assignment,
                port: portToUse,
                default_metrics: useDefaultMetrics,
                labels,
                prefix
            };

            this.prefix = apiConfig.prefix || `teraslice_${apiConfig.assignment}_`;

            this.default_labels = {
                name: terasliceName,
                url: prom_metrics_display_url,
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
        if (metric.metric instanceof Gauge) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            const res = metric.metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            ));
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

        if (metric.metric instanceof Counter || metric.metric instanceof Gauge) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            const res = metric.metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            ));
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

        if (metric.metric instanceof Gauge) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            const res = metric.metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            ));
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

        if (metric.metric instanceof Summary || metric.metric instanceof Histogram) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            const res = metric.metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            ));
            res.observe(value);
        } else {
            throw new Error(`observe not available on ${name} metric`);
        }
    }

    /**
     * [addGauge (define) new gauge]
     * @param  {string} name [metric name]
     * @param  {string} help [metric help]
     * @param  {Array<string>} labelsNames [list of label names]
     * @param  {CollectFunction<Gauge>} collectFn [fn invoked when metrics endpoint scraped]
     * @return {Promise<void>}
     */
    async addGauge(
        name: string,
        help: string,
        labelsNames: Array<string>,
        collectFn?: CollectFunction<Gauge>,
    ): Promise<void> {
        if (!this.hasMetric(name)) {
            const fullname = this.prefix + name;
            this.metricList[name] = this._createGaugeMetric(
                fullname, help, labelsNames.concat(Object.keys(this.default_labels)), collectFn
            );
        } else {
            this.logger.info(`metric ${name} already defined in metric list`);
        }
    }

    /**
     * [addCounter (define) new counter metric]
     * @param  {string} name [metric name]
     * @param  {string} help [metric help]
     * @param  {Array<string>} labelsNames [list of label names]
     * @param  {CollectFunction<Counter>} collectFn [fn invoked when metrics endpoint scraped]
     * @return {Promise<void>}
     */
    async addCounter(
        name: string,
        help: string,
        labelsNames: Array<string>,
        collectFn?: CollectFunction<Counter>,
    ): Promise<void> {
        if (!this.hasMetric(name)) {
            const fullname = this.prefix + name;
            this.metricList[name] = this._createCounterMetric(
                fullname, help, labelsNames.concat(Object.keys(this.default_labels)), collectFn
            );
        } else {
            this.logger.info(`metric ${name} already defined in metric list`);
        }
    }

    /**
     * [addHistogram (define) new histogram metric]
     * @param  {string} name [metric name]
     * @param  {string} help [metric help]
     * @param  {Array<string>} labelsNames [list of label names]
     * @param  {CollectFunction<Histogram>} collectFn [fn invoked when metrics endpoint scraped]
     * @return {Promise<void>}
     */
    async addHistogram(
        name: string,
        help: string,
        labelsNames: Array<string>,
        collectFn?: CollectFunction<Histogram>,
        buckets: Array<number> = [0.1, 5, 15, 50, 100, 500],
    ): Promise<void> {
        if (!this.hasMetric(name)) {
            const fullname = this.prefix + name;
            this.metricList[name] = this._createHistogramMetric(
                fullname,
                help,
                labelsNames.concat(Object.keys(this.default_labels)),
                buckets,
                collectFn
            );
        } else {
            this.logger.info(`metric ${name} already defined in metric list`);
        }
    }

    /**
     * [addSummary (define) new summary metric]
     * @param  {string} name [metric name]
     * @param  {string} help [metric help]
     * @param  {Array<string>} labelsNames [list of label names]
     * @param  {CollectFunction<Summary>} collectFn [fn invoked when metrics endpoint scraped]
     * @param  {Array<number>} percentiles [metric percentiles, default[0.01, 0.1, 0.9, 0.99] ]
     * @param  {number} maxAgeSeconds [how old a bucket can be before it is reset ]
     * @param  {number} ageBuckets [how many buckets for sliding window ]
     * @return {Promise<void>}
     */
    async addSummary(
        name: string,
        help: string,
        labelsNames: Array<string>,
        collectFn?: CollectFunction<Summary>,
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
                ageBuckets,
                collectFn,
            );
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
            deleted = delete this.metricList[name];
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

    private _createGaugeMetric(name: string, help: string,
        labelsNames: Array<string>, collect?: CollectFunction<Gauge>): any {
        const gauge = new Gauge({
            name,
            help,
            labelNames: labelsNames,
            collect
        });
        return { name, metric: gauge, functions: new Set(['inc', 'dec', 'set']) };
    }

    private _createCounterMetric(name: string, help: string,
        labelsNames: Array<string>, collect?: CollectFunction<Counter>): any {
        const counter = new Counter({
            name,
            help,
            labelNames: labelsNames,
            collect
        });
        return { name, metric: counter, functions: new Set(['inc']) };
    }

    private _createHistogramMetric(name: string, help: string, labelsNames: Array<string>,
        buckets: Array<number>, collect?: CollectFunction<Histogram>): any {
        const histogram = new Histogram({
            name,
            help,
            labelNames: labelsNames,
            buckets,
            collect
        });
        return { name, metric: histogram, functions: new Set(['observe']) };
    }

    private _createSummaryMetric(
        name: string,
        help: string,
        labelsNames: Array<string>,
        percentiles: Array<number>,
        ageBuckets: number,
        maxAgeSeconds: number,
        collect?: CollectFunction<Summary>,
    ): any {
        const summary = new Summary({
            name,
            help,
            labelNames: labelsNames,
            percentiles,
            maxAgeSeconds,
            ageBuckets,
            collect
        });
        return { name, metric: summary, functions: new Set(['observe']) };
    }

    private _setPodName(): void {
        // in a pod the hostname is the pod name
        const host = os.hostname();
        if (host.startsWith('ts-wkr-') || host.startsWith('ts-exc-')) {
            this.default_labels.pod_name = host;
        }
    }

    private async createAPI(apiConfig: tf.PromMetricsAPIConfig) {
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

    getDefaultLabels() {
        return this.default_labels;
    }

    verifyAPI(): boolean {
        return this.apiRunning;
    }

    resetMetrics() {
        this.metricExporter.resetMetrics();
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
