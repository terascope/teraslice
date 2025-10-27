import path from 'node:path';
import { EventEmitter } from 'node:events';
import { Terafoundation } from '@terascope/types';
import {
    random, isString, getTypeOf,
    isFunction, debugLogger, Logger,
    makeISODate
} from '@terascope/core-utils';
import promClient, {
    CollectFunction, Counter, Gauge, Histogram, Summary
} from 'prom-client';
import * as i from './interfaces/index.js';

function newId(): number {
    return random(10000, 99999);
}

export function newTestSlice(request: i.SliceRequest = {}): i.Slice {
    return {
        slice_id: `slice-id-${newId()}`,
        slicer_id: random(0, 99999),
        slicer_order: random(0, 99999),
        request,
        _created: makeISODate(),
    };
}

export function newTestJobConfig(
    defaults: Partial<i.JobConfigParams> = {}
): i.ValidatedJobConfig {
    return Object.assign(
        {
            name: 'test-job',
            apis: [],
            operations: [],
            active: true,
            analytics: false,
            autorecover: false,
            assets: [],
            lifecycle: 'once',
            max_retries: 0,
            probation_window: 30000,
            slicers: 1,
            workers: 1,
            env_vars: {}
        },
        defaults
    );
}

export function newTestExecutionConfig(
    jobConfig: Partial<i.JobConfigParams> = {}
): i.ExecutionConfig {
    const exConfig = newTestJobConfig(jobConfig) as i.ExecutionConfig;
    exConfig.slicer_hostname = 'example.com';
    exConfig.slicer_port = random(8000, 60000);
    exConfig.ex_id = `ex-id-${newId()}`;
    exConfig.job_id = `job-id-${newId()}`;
    if (!exConfig.metadata) exConfig.metadata = {};
    return exConfig;
}
interface ClientFactoryFns {
    [prop: string]: i.CreateClientFactoryFn;
}

export interface CachedClients {
    [prop: string]: any;
}

export interface TestContextAPIs extends i.ExecutionContextAPIs {
    setTestClients(clients: i.TestClientConfig[]): void;
    getTestClients(): i.TestClients;
    scrapePromMetrics(): Promise<string>;
}

export interface MockPromMetrics {
    metricList: Terafoundation.MetricList;
    defaultLabels: Record<string, string>;
    prefix: string;
}

type GetKeyOpts = {
    type: string;
    endpoint?: string;
};

function getKey(opts: GetKeyOpts) {
    const { type, endpoint = 'default' } = opts;
    if (!isString(type)) throw new Error('A type must be specified when registering a Client');
    return `${type}:${endpoint}`;
}

function setConnectorConfig<T extends Record<string, any>>(
    sysconfig: i.SysConfig,
    opts: GetKeyOpts,
    config: T,
    override = true
): T {
    const { type, endpoint = 'default' } = opts;
    const { connectors } = sysconfig.terafoundation;
    if (connectors[type] == null) connectors[type] = {};
    if (connectors[type][endpoint] == null) {
        connectors[type][endpoint] = config;
    } else if (override) {
        connectors[type][endpoint] = config;
    }
    return connectors[type][endpoint];
}

export interface TestContextOptions {
    assignment?: i.Assignment;
    clients?: i.TestClientConfig[];
    cluster_manager_type?: i.ClusterManagerType;
}

const _cachedClients = new WeakMap<TestContext, CachedClients>();
const _createClientFns = new WeakMap<TestContext, ClientFactoryFns>();

export class TestContext implements i.Context {
    logger: Logger;
    sysconfig: i.SysConfig;
    cluster: Terafoundation.Cluster;
    apis: i.TestContextApis & Terafoundation.ContextAPIs;
    name: string;
    assignment: i.Assignment = 'worker';
    platform: string = process.platform;
    arch: string = process.arch;
    mockPromMetrics: MockPromMetrics | null;

    constructor(testName: string, options: TestContextOptions = {}) {
        const logger = debugLogger(testName);
        const events = new EventEmitter();

        this.name = testName;
        if (options.assignment) {
            this.assignment = options.assignment;
        }
        this.logger = logger;

        this.cluster = {
            // @ts-expect-error
            worker: {
                id: newId(),
            },
        };

        const sysconfig: i.SysConfig = {
            terafoundation: {
                workers: 8,
                environment: 'test',
                log_path: '',
                log_level: { console: 'debug' } as any,
                logging: ['console'],
                connectors: {
                    'elasticsearch-next': {
                        default: {}
                    },
                },
                prom_metrics_enabled: false,
                prom_metrics_port: 3333,
                prom_metrics_add_default: true,
                prom_metrics_display_url: 'http://localhost',
            },
            teraslice: {
                action_timeout: 10000,
                analytics_rate: 10000,
                api_response_timeout: 300000,
                assets_directory: path.join(process.cwd(), 'assets'),
                assets_volume: '',
                asset_storage_connection_type: 'elasticsearch-next',
                asset_storage_connection: 'default',
                asset_storage_bucket: '',
                cluster_manager_type: options.cluster_manager_type || 'native',
                cpu_execution_controller: 0.5,
                ephemeral_storage: false,
                hostname: 'localhost',
                index_rollover_frequency: {
                    analytics: 'yearly',
                    state: 'monthly',
                },
                kubernetes_api_poll_delay: 1000,
                kubernetes_config_map_name: 'teraslice-worker',
                kubernetes_image_pull_secret: '',
                kubernetes_image: 'terascope/teraslice',
                kubernetes_namespace: 'default',
                kubernetes_overrides_enabled: false,
                kubernetes_priority_class_name: undefined,
                kubernetes_worker_antiaffinity: false,
                master_hostname: 'localhost',
                master: false,
                memory_execution_controller: 512000000,
                name: testName,
                network_latency_buffer: 100,
                node_disconnect_timeout: 5000,
                node_state_interval: 5000,
                port: 55678,
                shutdown_timeout: 10000,
                slicer_allocation_attempts: 1,
                slicer_port_range: '55679:56678',
                slicer_timeout: 10000,
                env_vars: {},
                state: {
                    connection: 'default',
                },
                worker_disconnect_timeout: 3000,
                workers: 1,
            },
            _nodeName: `${testName}-${newId()}__${this?.cluster?.worker?.id}`,
        };

        this.sysconfig = sysconfig;

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const ctx = this;
        _cachedClients.set(this, {});
        _createClientFns.set(this, {});

        this.mockPromMetrics = null;
        this.apis = {
            foundation: {
                makeLogger(...params: any[]): Logger {
                    return logger.child(params[0]);
                },
                startWorkers() {
                    const workers: Terafoundation.FoundationWorker[] = [];
                    return workers;
                },
                async createClient(opts: i.ConnectionConfig) {
                    const { cached } = opts;

                    const cachedClients = _cachedClients.get(ctx) || {};
                    const key = getKey(opts);
                    if (cached && cachedClients[key] != null) {
                        return cachedClients[key];
                    }

                    const clientFns = _createClientFns.get(ctx) || {};
                    const create = clientFns[key];

                    if (!create) throw new Error(`No client was found for connection "${key}"`);
                    if (!isFunction(create)) {
                        const actual = getTypeOf(create);
                        throw new Error(`Registered Client for connection "${key}" is not a function, got ${actual}`);
                    }

                    const connectorConfig = setConnectorConfig(ctx.sysconfig, opts, {}, false);

                    const client = await create(connectorConfig, ctx.logger, opts);

                    cachedClients[key] = client;
                    _cachedClients.set(ctx, cachedClients);

                    return client;
                },
                getSystemEvents(): EventEmitter {
                    return events;
                },
                promMetrics: {
                    async init(config: Terafoundation.PromMetricsInitConfig) {
                        const {
                            assignment, job_prom_metrics_add_default, job_prom_metrics_enabled,
                            tf_prom_metrics_add_default, tf_prom_metrics_enabled,
                            labels, prefix
                        } = config;

                        if (ctx.mockPromMetrics) {
                            throw new Error('Prom metrics API cannot be initialized more than once.');
                        }

                        const useDefaultMetrics = job_prom_metrics_add_default !== undefined
                            ? job_prom_metrics_add_default
                            : tf_prom_metrics_add_default;

                        const defaultLabels = {
                            name: 'mockPromMetrics',
                            ...labels
                        };

                        const finalPrefix = prefix || `teraslice_${assignment}_`;

                        if (useDefaultMetrics) {
                            const defaultMetricsConfig = {
                                prefix: finalPrefix,
                                labels: defaultLabels
                            };
                            promClient.collectDefaultMetrics(defaultMetricsConfig);
                        }

                        if (job_prom_metrics_enabled === true
                            || (job_prom_metrics_enabled === undefined
                                && tf_prom_metrics_enabled)
                        ) {
                            ctx.mockPromMetrics = {
                                metricList: {},
                                prefix: finalPrefix,
                                defaultLabels
                            };
                            return true;
                        }
                        logger.warn('Cannot create PromMetricsAPI because metrics are disabled.');
                        return false;
                    },
                    set(name: string, labels: Record<string, string>, value: number): void {
                        if (ctx.mockPromMetrics) {
                            const metric = ctx.mockPromMetrics.metricList[name];
                            if (!metric || !metric.functions || !metric.metric) {
                                throw new Error(`Metric ${name} is not setup`);
                            }
                            if (metric.metric instanceof Gauge) {
                                const labelValues = Object.keys(labels).map((key) => labels[key]);
                                const res = metric.metric.labels(...labelValues.concat(
                                    Object.values(this.getDefaultLabels())
                                ));
                                res.set(value);
                            } else {
                                throw new Error(`set not available on ${name} metric`);
                            }
                        }
                    },
                    inc(name: string, labels: Record<string, string>, value: number): void {
                        if (ctx.mockPromMetrics) {
                            const metric = ctx.mockPromMetrics.metricList[name];
                            if (!metric || !metric.functions || !metric.metric) {
                                throw new Error(`Metric ${name} is not setup`);
                            }
                            if (metric.metric instanceof Counter
                                || metric.metric instanceof Gauge
                            ) {
                                const labelValues = Object.keys(labels).map((key) => labels[key]);
                                const res = metric.metric.labels(...labelValues.concat(
                                    Object.values(this.getDefaultLabels())
                                ));
                                res.inc(value);
                            } else {
                                throw new Error(`inc not available on ${name} metric`);
                            }
                        }
                    },
                    dec(name: string, labels: Record<string, string>, value: number): void {
                        if (ctx.mockPromMetrics) {
                            const metric = ctx.mockPromMetrics.metricList[name];
                            if (!metric || !metric.functions || !metric.metric) {
                                throw new Error(`Metric ${name} is not setup`);
                            }

                            if (metric.metric instanceof Gauge) {
                                const labelValues = Object.keys(labels).map((key) => labels[key]);
                                const res = metric.metric.labels(...labelValues.concat(
                                    Object.values(this.getDefaultLabels())
                                ));
                                res.dec(value);
                            } else {
                                throw new Error(`dec not available on ${name} metric`);
                            }
                        }
                    },
                    observe(
                        name: string,
                        labels: Record<string, string>,
                        value: number
                    ): void {
                        if (ctx.mockPromMetrics) {
                            const metric = ctx.mockPromMetrics.metricList[name];
                            if (!metric || !metric.functions || !metric.metric) {
                                throw new Error(`Metric ${name} is not setup`);
                            }

                            if (metric.metric instanceof Summary
                                || metric.metric instanceof Histogram) {
                                const labelValues = Object.keys(labels).map((key) => labels[key]);
                                const res = metric.metric.labels(...labelValues.concat(
                                    Object.values(this.getDefaultLabels())
                                ));
                                res.observe(value);
                            } else {
                                throw new Error(`observe not available on ${name} metric`);
                            }
                        }
                    },
                    async addGauge(
                        name: string,
                        help: string,
                        labelNames: Array<string>,
                        collect?: CollectFunction<Gauge>
                    ): Promise<void> {
                        if (ctx.mockPromMetrics) {
                            if (!this.hasMetric(name)) {
                                const fullname = ctx.mockPromMetrics.prefix + name;
                                const gauge = new Gauge({
                                    name: fullname,
                                    help,
                                    labelNames,
                                    collect
                                });
                                ctx.mockPromMetrics.metricList[name] = {
                                    name,
                                    metric: gauge,
                                    functions: new Set<string>(['inc', 'dec', 'set'])
                                };
                            } else {
                                logger.info(`metric ${name} already defined in metric list`);
                            }
                        }
                    },
                    async addCounter(
                        name: string,
                        help: string,
                        labelNames: Array<string>,
                        collect?: CollectFunction<Counter>
                    ): Promise<void> {
                        if (ctx.mockPromMetrics) {
                            if (!this.hasMetric(name)) {
                                const fullname = ctx.mockPromMetrics.prefix + name;
                                const counter = new Counter({
                                    name: fullname,
                                    help,
                                    labelNames,
                                    collect
                                });
                                ctx.mockPromMetrics.metricList[name] = {
                                    name,
                                    metric: counter,
                                    functions: new Set<string>(['inc'])
                                };
                            } else {
                                logger.info(`metric ${name} already defined in metric list`);
                            }
                        }
                    },
                    async addHistogram(
                        name: string,
                        help: string,
                        labelNames: Array<string>,
                        collect?: CollectFunction<Histogram>,
                        buckets: number[] = [0.1, 5, 15, 50, 100, 500]
                    ): Promise<void> {
                        if (ctx.mockPromMetrics) {
                            if (!this.hasMetric(name)) {
                                const fullname = ctx.mockPromMetrics.prefix + name;
                                const histogram = new Histogram({
                                    name: fullname,
                                    help,
                                    labelNames,
                                    buckets,
                                    collect
                                });
                                ctx.mockPromMetrics.metricList[name] = {
                                    name,
                                    metric: histogram,
                                    functions: new Set<string>(['observe'])
                                };
                            } else {
                                logger.info(`metric ${name} already defined in metric list`);
                            }
                        }
                    },
                    async addSummary(
                        name: string,
                        help: string,
                        labelNames: Array<string>,
                        collect?: CollectFunction<Summary>,
                        maxAgeSeconds = 600,
                        ageBuckets = 5,
                        percentiles: Array<number> = [0.01, 0.1, 0.9, 0.99]
                    ): Promise<void> {
                        if (ctx.mockPromMetrics) {
                            if (!this.hasMetric(name)) {
                                const fullname = ctx.mockPromMetrics.prefix + name;
                                const summary = new Summary({
                                    name: fullname,
                                    help,
                                    labelNames,
                                    percentiles,
                                    maxAgeSeconds,
                                    ageBuckets,
                                    collect
                                });
                                ctx.mockPromMetrics.metricList[name] = {
                                    name,
                                    metric: summary,
                                    functions: new Set<string>(['observe'])
                                };
                            } else {
                                logger.info(`metric ${name} already defined in metric list`);
                            }
                        }
                    },
                    hasMetric(name: string): boolean {
                        if (ctx.mockPromMetrics) {
                            return (name in ctx.mockPromMetrics.metricList);
                        }
                        return false;
                    },
                    async deleteMetric(name: string): Promise<boolean> {
                        let deleted = false;
                        if (ctx.mockPromMetrics) {
                            const fullname = ctx.mockPromMetrics.prefix + name;
                            if (ctx.mockPromMetrics.metricList[name]) {
                                deleted = delete ctx.mockPromMetrics.metricList[name];
                                promClient.register.removeSingleMetric(fullname);
                            } else {
                                throw new Error(`metric ${name} not defined in metric list`);
                            }
                            return deleted;
                        }
                        return deleted;
                    },
                    getDefaultLabels() {
                        if (ctx.mockPromMetrics) {
                            return ctx.mockPromMetrics.defaultLabels;
                        }
                        return {};
                    },
                    verifyAPI(): boolean {
                        return ctx.mockPromMetrics !== null;
                    },
                    resetMetrics() {
                        if (ctx.mockPromMetrics) {
                            ctx.mockPromMetrics.metricList = {};
                        }
                    },
                    async shutdown(): Promise<void> {
                        ctx.mockPromMetrics = null;
                    }
                },
            },
            registerAPI(namespace: string, apis: any): void {
                this[namespace] = apis;
            },
            setTestClients(clients: i.TestClientConfig[] = []) {
                clients.forEach((clientConfig) => {
                    const { createClient, config: connectionConfig = {} } = clientConfig;
                    const createFN = createClient;
                    const clientFns = _createClientFns.get(ctx) || {};

                    const key = getKey(clientConfig);
                    if (!isFunction(createFN)) {
                        const actual = getTypeOf(createFN);
                        throw new Error(`Test Client for connection "${key}" is not a function, got ${actual}`);
                    }

                    ctx.logger.trace(`Setting test client for connection "${key}"`, connectionConfig);

                    clientFns[key] = createFN;
                    _createClientFns.set(ctx, clientFns);

                    const cachedClients = _cachedClients.get(ctx) || {};
                    delete cachedClients[key];
                    _cachedClients.set(ctx, cachedClients);

                    setConnectorConfig(ctx.sysconfig, clientConfig, connectionConfig, true);
                });
            },
            getTestClients(): i.TestClients {
                const cachedClients = _cachedClients.get(ctx) || {};
                const clients: Record<string, any> = {};

                Object.keys(cachedClients).forEach((key) => {
                    const [type, endpoint] = key.split(':', 2) as [string, string];
                    if (clients[type] == null) {
                        clients[type] = {};
                    }
                    clients[type][endpoint] = cachedClients[key];
                });

                return clients;
            },
            async scrapePromMetrics(): Promise<string> {
                if (ctx.mockPromMetrics) {
                    return promClient.register.metrics();
                }
                return '';
            },
            op_runner: {} as any,
            assets: {} as any,
            job_runner: {} as any,
            executionContext: {} as any
        } as i.TestContextApis & Terafoundation.ContextAPIs;

        if (options.clients) {
            this.apis.setTestClients(options.clients);
        }
    }
}
