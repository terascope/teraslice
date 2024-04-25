import * as ts from '@terascope/utils';
import { nanoid } from 'nanoid';
import * as i from './interfaces';
import { CoreContext } from './core-context';
import validateConfigs from './validate-configs';

interface ClientFactoryFns {
    [prop: string]: i.ClientFactoryFn | i.CreateClientFactoryFn;
}

export interface CachedClients {
    [prop: string]: any;
}

export interface TestClientConfig {
    type: string;
    create?: i.ClientFactoryFn;
    createClient?: i.CreateClientFactoryFn;
    config?: Record<string, any>;
    endpoint?: string;
}

export interface TestClientsByEndpoint {
    [endpoint: string]: any;
}

export interface TestClients {
    [type: string]: TestClientsByEndpoint;
}

export interface TestContextAPIs {
    setTestClients(clients: TestClientConfig[]): void;
    getTestClients(): TestClients;
}

type GetKeyOpts = {
    type: string;
    endpoint?: string;
};

function getKey(opts: GetKeyOpts) {
    const { type, endpoint = 'default' } = opts;
    if (!ts.isString(type)) throw new Error('A type must be specified when registering a Client');
    return `${type}:${endpoint}`;
}

function setConnectorConfig<T extends Record<string, any>>(
    sysconfig: i.FoundationSysConfig<Record<string, any>>,
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

const _cachedClients = new WeakMap<TestContext<ts.AnyObject, ts.AnyObject>, CachedClients>();
const _createClientFns = new WeakMap<TestContext<ts.AnyObject, ts.AnyObject>, ClientFactoryFns>();

export interface TestContextOptions<S> {
    name?: string;
    assignment?: any;
    clients?: TestClientConfig[];
    sysconfig?: ts.PartialDeep<i.FoundationSysConfig<S>>;
}

export interface TestPromMetrics {
    apiConfig: i.PromMetricsAPIConfig;
    metricList: Record<string, {
        readonly name?: string,
        readonly help?: string,
        readonly labelNames?: Array<string>,
        readonly buckets?: Array<number>,
        readonly percentiles?: Array<number>,
        readonly ageBuckets?: number,
        readonly maxAgeSeconds?: number
        readonly metric?: 'Gauge' | 'Counter' | 'Histogram' | 'Summary',
        readonly functions?: Set<string>,
        value?: number;
        summary?: object;
        histogram?: object;
    }>;
}

function getDefaultSysconfig<S>(
    options: TestContextOptions<S>
): ts.PartialDeep<i.FoundationSysConfig<S>> {
    return {
        terafoundation: {
            connectors: {
                'elasticsearch-next': {
                    default: {},
                },
                s3: {
                    default: {}
                }
            },
            ...ts.get(options.sysconfig, 'terafoundation', {})
        },
        ...options.sysconfig
    };
}

export class TestContext<
    S extends Record<string, any>,
    A extends Record<string, any>,
    D extends string = string,
> extends CoreContext<S, A & TestContextAPIs, D> {
    constructor(options: TestContextOptions<S> = {}) {
        const sysconfig = getDefaultSysconfig(options);
        const config: i.FoundationConfig<S, A & TestContextAPIs, D> = {
            name: options.name || 'test-context',
        };
        const cluster: i.Cluster = {
            isMaster: false,
            worker: {
                id: nanoid(8),
            }
        } as any;

        super(config, cluster, validateConfigs(cluster, config, sysconfig));

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const ctx = this;
        _cachedClients.set(this, {});
        _createClientFns.set(this, {});

        this.apis.foundation.getConnection = (opts: i.ConnectionConfig) => {
            const { cached } = opts;

            const cachedClients = _cachedClients.get(ctx) || {};
            const key = getKey(opts);
            if (cached && cachedClients[key] != null) {
                return cachedClients[key];
            }

            const clientFns = _createClientFns.get(ctx) || {};
            const create = clientFns[key];

            if (!create) throw new Error(`No client was found for connection "${key}"`);
            if (!ts.isFunction(create)) {
                const actual = ts.getTypeOf(create);
                throw new Error(`Registered Client for connection "${key}" is not a function, got ${actual}`);
            }

            const connectorConfig = setConnectorConfig(ctx.sysconfig, opts, {}, false);

            const client = create(connectorConfig, ctx.logger, opts);

            cachedClients[key] = client;
            _cachedClients.set(ctx, cachedClients);

            return client;
        };

        this.apis.foundation.createClient = async (opts: i.ConnectionConfig) => {
            const { cached } = opts;

            const cachedClients = _cachedClients.get(ctx) || {};
            const key = getKey(opts);
            if (cached && cachedClients[key] != null) {
                return cachedClients[key];
            }

            const clientFns = _createClientFns.get(ctx) || {};
            const create = clientFns[key];

            if (!create) throw new Error(`No client was found for connection "${key}"`);
            if (!ts.isFunction(create)) {
                const actual = ts.getTypeOf(create);
                throw new Error(`Registered Client for connection "${key}" is not a function, got ${actual}`);
            }

            const connectorConfig = setConnectorConfig(ctx.sysconfig, opts, {}, false);

            const client = await create(connectorConfig, ctx.logger, opts);

            cachedClients[key] = client;
            _cachedClients.set(ctx, cachedClients);

            return client;
        };

        let promMetricsAPI: TestPromMetrics | null;
        this.apis.foundation.promMetrics = {
            init: async (initConfig: i.PromMetricsInitConfig) => {
                const { terafoundation, teraslice } = initConfig.context.sysconfig;
                const metricsEnabledInTF = terafoundation.prom_metrics_enabled;
                const portToUse = initConfig.port || terafoundation.prom_metrics_port || 3333;

                if (promMetricsAPI) {
                    throw new Error('Prom metrics API cannot be initialized more than once.');
                }

                if (teraslice.cluster_manager_type === 'native') {
                    ctx.logger.warn('Skipping PromMetricsAPI initialization: incompatible with native clustering.');
                    return false;
                }

                let useDefaultMetrics: boolean;
                if (initConfig.default_metrics !== undefined) {
                    useDefaultMetrics = initConfig.default_metrics;
                } else if (terafoundation.prom_metrics_add_default !== undefined) {
                    useDefaultMetrics = terafoundation.prom_metrics_add_default;
                } else {
                    useDefaultMetrics = true;
                }

                if (initConfig.metrics_enabled_by_job
                    || (initConfig.metrics_enabled_by_job === undefined && metricsEnabledInTF)) {
                    const apiConfig: i.PromMetricsAPIConfig = {
                        assignment: initConfig.assignment,
                        port: portToUse,
                        default_metrics: useDefaultMetrics,
                        labels: initConfig.labels,
                        prefix: initConfig.prefix
                    };
                    promMetricsAPI = {
                        apiConfig,
                        metricList: {}
                    };
                    return true;
                }
                ctx.logger.warn('Cannot create PromMetricsAPI because metrics are disabled.');
                return false;
            },
            set: (name: string, labels: Record<string, string>, value: number): void => {
                if (promMetricsAPI) {
                    const metric = promMetricsAPI.metricList[name];
                    if (this.apis.foundation.promMetrics.hasMetric(name) && metric.functions?.has('inc') && metric.value) {
                        promMetricsAPI.metricList[name].value = value;
                    }
                }
            },
            inc: (name: string, labelValues: Record<string, string>, value: number): void => {
                if (promMetricsAPI) {
                    const metric = promMetricsAPI.metricList[name];
                    if (this.apis.foundation.promMetrics.hasMetric(name) && metric.functions?.has('inc') && metric.value) {
                        metric.value += value;
                    }
                }
            },
            dec: (name: string, labelValues: Record<string, string>, value: number): void => {
                if (promMetricsAPI) {
                    const metric = promMetricsAPI.metricList[name];
                    if (this.apis.foundation.promMetrics.hasMetric(name) && metric.functions?.has('dec') && metric.value) {
                        metric.value -= value;
                    }
                }
            },
            observe: (
                name: string,
                labelValues: Record<string, string>,
                value: number
            ): void => {
                if (promMetricsAPI) {
                    const metric = promMetricsAPI.metricList[name];
                    if (!metric.functions || !metric.metric) {
                        throw new Error(`Metric ${name} is not setup`);
                    }

                    if (metric.functions.has('observe')) {
                        if (metric.summary) {
                            metric.summary[value] = '?????'; // fixme
                        }
                        if (metric.histogram) {
                            metric.histogram[value] = '?????'; // fixme
                        }
                    } else {
                        throw new Error(`observe not available on ${name} metric`);
                    }
                }
            },
            addMetric: async (
                name: string,
                help: string,
                labelNames: Array<string>,
                type: 'gauge' | 'counter' | 'histogram',
                buckets?: Array<number>
            ): Promise<void> => {
                if (promMetricsAPI) {
                    if (!this.apis.foundation.promMetrics.hasMetric(name)) {
                        if (type === 'gauge') {
                            promMetricsAPI.metricList[name] = {
                                name,
                                help,
                                labelNames,
                                metric: 'Gauge',
                                functions: new Set<string>(['inc', 'dec', 'set']),
                                value: 0
                            };
                        }
                        if (type === 'counter') {
                            promMetricsAPI.metricList[name] = {
                                name,
                                help,
                                labelNames,
                                metric: 'Counter',
                                functions: new Set<string>(['inc', 'dec']),
                                value: 0
                            };
                        }
                        if (type === 'histogram') {
                            promMetricsAPI.metricList[name] = {
                                name,
                                help,
                                labelNames,
                                buckets,
                                metric: 'Histogram',
                                functions: new Set<string>(['observe']),
                                histogram: {}
                            };
                        }
                    } else {
                        ctx.logger.info(`metric ${name} already defined in metric list`);
                    }
                }
            },
            addSummary: async (
                name: string,
                help: string,
                labelNames: Array<string>,
                ageBuckets: number,
                maxAgeSeconds: number,
                percentiles: Array<number>
            ): Promise<void> => {
                if (promMetricsAPI) {
                    promMetricsAPI.metricList[name] = {
                        name,
                        help,
                        labelNames,
                        percentiles,
                        maxAgeSeconds,
                        ageBuckets
                    };
                }
            },
            hasMetric: (name: string): boolean => {
                if (promMetricsAPI) {
                    return (name in promMetricsAPI.metricList);
                }
                return false;
            },
            deleteMetric: async (name: string): Promise<boolean> => {
                let deleted = false;
                if (this.apis.foundation.promMetrics.hasMetric(name)) {
                    if (promMetricsAPI) {
                        deleted = delete promMetricsAPI.metricList[name];
                    }
                    return false;
                }
                return deleted;
            },
            shutdown: async (): Promise<void> => {
                promMetricsAPI = null;
            }
        };

        this.apis.setTestClients = (clients: TestClientConfig[] = []) => {
            clients.forEach((clientConfig) => {
                const { create, createClient, config: connectionConfig = {} } = clientConfig;
                const createFN = createClient || create;
                const clientFns = _createClientFns.get(ctx) || {};

                const key = getKey(clientConfig);
                if (!ts.isFunction(createFN)) {
                    const actual = ts.getTypeOf(createFN);
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
        };

        this.apis.getTestClients = () => {
            const cachedClients = _cachedClients.get(ctx) || {};
            const clients = {};

            Object.keys(cachedClients).forEach((key) => {
                const [type, endpoint] = key.split(':', 2) as [string, string];
                if (clients[type] == null) {
                    clients[type] = {};
                }
                clients[type][endpoint] = cachedClients[key];
            });

            return clients;
        };

        this.foundation.getConnection = this.apis.foundation.getConnection;

        if (options.clients) {
            this.apis.setTestClients(options.clients);
        }
    }
}
