import path from 'path';
import { EventEmitter } from 'events';
import {
    random, isString, getTypeOf,
    isFunction, debugLogger, Logger,
    makeISODate
} from '@terascope/utils';
import * as i from './interfaces';

function newId(prefix: string): string {
    return `${prefix}-${random(10000, 99999)}`;
}

export function newTestSlice(request: i.SliceRequest = {}): i.Slice {
    return {
        slice_id: newId('slice-id'),
        slicer_id: random(0, 99999),
        slicer_order: random(0, 99999),
        request,
        _created: makeISODate(),
    };
}

export function newTestJobConfig(
    defaults: Partial<i.JobConfig> = {}
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

export function newTestExecutionConfig(jobConfig: Partial<i.JobConfig> = {}): i.ExecutionConfig {
    const exConfig = newTestJobConfig(jobConfig) as i.ExecutionConfig;
    exConfig.slicer_hostname = 'example.com';
    exConfig.slicer_port = random(8000, 60000);
    exConfig.ex_id = newId('ex-id');
    exConfig.job_id = newId('job-id');
    if (!exConfig.metadata) exConfig.metadata = {};
    return exConfig;
}

/**
 * Create a new Execution Context
 * @deprecated use the new WorkerExecutionContext and SlicerExecutionContext
 */
export function newTestExecutionContext(
    type: i.Assignment,
    config: i.ExecutionConfig
): i.LegacyExecutionContext {
    if (type === 'execution_controller') {
        return {
            config,
            queue: [],
            reader: null,
            slicer: () => {},
            dynamicQueueLength: false,
            queueLength: 10000,
        };
    }

    return {
        config,
        queue: config.operations.map(() => () => {}),
        reader: () => {},
        slicer: () => {},
        dynamicQueueLength: false,
        queueLength: 10000,
    };
}

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

export interface TestContextAPIs extends i.ContextAPIs {
    setTestClients(clients: TestClientConfig[]): void;
    getTestClients(): TestClients;
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

function isPromise(p: any): boolean {
    if (p && typeof p === 'object' && typeof p?.then === 'function') {
        return true;
    }

    return false;
}

export interface TestContextOptions {
    assignment?: i.Assignment;
    clients?: TestClientConfig[];
}

const _cachedClients = new WeakMap<TestContext, CachedClients>();
const _createClientFns = new WeakMap<TestContext, ClientFactoryFns>();

export class TestContext implements i.Context {
    logger: Logger;
    sysconfig: i.SysConfig;
    cluster: i.ContextClusterConfig;
    apis: TestContextAPIs | i.WorkerContextAPIs | i.ContextAPIs;
    foundation: i.LegacyFoundationApis;
    name: string;
    assignment: i.Assignment = 'worker';
    platform: string = process.platform;
    arch: string = process.arch;

    constructor(testName: string, options: TestContextOptions = {}) {
        const logger = debugLogger(testName);
        const events = new EventEmitter();

        this.name = testName;
        if (options.assignment) {
            this.assignment = options.assignment;
        }
        this.logger = logger;

        this.cluster = {
            worker: {
                id: newId('id'),
            },
        };

        const sysconfig: i.SysConfig = {
            terafoundation: {
                connectors: {
                    elasticsearch: {
                        default: {},
                    },
                    'elasticsearch-next': {
                        default: {}
                    },
                },
            },
            teraslice: {
                action_timeout: 10000,
                analytics_rate: 10000,
                assets_directory: path.join(process.cwd(), 'assets'),
                cluster_manager_type: 'native',
                hostname: 'localhost',
                index_rollover_frequency: {
                    analytics: 'yearly',
                    state: 'montly',
                },
                master_hostname: 'localhost',
                master: false,
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
            _nodeName: `${newId(testName)}__${this.cluster.worker.id}`,
        };

        this.sysconfig = sysconfig;

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const ctx = this;
        _cachedClients.set(this, {});
        _createClientFns.set(this, {});

        this.apis = {
            foundation: {
                makeLogger(...params: any[]): Logger {
                    return logger.child(params[0]);
                },
                getConnection(opts: i.ConnectionConfig): { client: any } {
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

                    const config = setConnectorConfig(sysconfig, opts, {}, false);

                    const client = create(config, logger, opts);

                    if (isPromise(client)) {
                        throw new Error('Cannot call a sync client creation method using an async function, please use createClient instead');
                    }

                    if (client) {
                        cachedClients[key] = client;
                    }

                    _cachedClients.set(ctx, cachedClients);

                    return client as { client: any };
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
            },
            registerAPI(namespace: string, apis: any): void {
                this[namespace] = apis;
            },
            setTestClients(clients: TestClientConfig[] = []) {
                clients.forEach((clientConfig) => {
                    const { create, createClient, config: connectionConfig = {} } = clientConfig;
                    const createFN = createClient || create;
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
            getTestClients(): TestClients {
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
            },
        } as TestContextAPIs;

        this.foundation = {
            getConnection: this.apis.foundation.getConnection,
            getEventEmitter: this.apis.foundation.getSystemEvents,
            makeLogger: this.apis.foundation.makeLogger,
        };

        this.apis.setTestClients(options.clients);
    }
}
