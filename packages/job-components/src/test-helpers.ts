
import debugFn from 'debug';
import { EventEmitter } from 'events';
import path from 'path';
import * as i from './interfaces';
import { random, isString, uniq, getTypeOf, isFunction } from './utils';

interface DebugParamObj {
    module: string;
    assignment?: string;
    [name: string]: any;
}

function newId(prefix: string): string {
    return `${prefix}-${random(10000, 99999)}`;
}

type debugParam = DebugParamObj | string;

export function debugLogger(testName: string, param?: debugParam, otherName?: string): i.Logger {
    const logger: i.Logger = new EventEmitter() as i.Logger;

    const parts: string[] = [testName];
    if (testName.indexOf('teraslice') < 0) {
        parts.unshift('teraslice');
    }

    if (param) {
        if (isString(param)) {
            parts.push(param as string);
        } else if (typeof param === 'object') {
            parts.push(param.module);
            if (param.assignment) {
                parts.push(param.assignment);
            }
        }
    }

    if (otherName) {
        parts.push(otherName);
    }

    const name = uniq(parts).join(':');

    logger.streams = [];

    logger.addStream = function (stream) {
        // @ts-ignore
        this.streams.push(stream);
    };

    logger.child = (opts: debugParam) => debugLogger(name, opts);
    logger.flush = () => Promise.resolve();
    logger.reopenFileStreams = () => {};
    logger.level = () => 50;
    // @ts-ignore
    logger.levels = () => 50;

    logger.src = false;

    const levels = [
        'trace',
        'debug',
        'info',
        'warn',
        'error',
        'fatal'
    ];

    for (const level of levels) {
        const fLevel = `[${level.toUpperCase()}]`;
        const debug = debugFn(name);
        logger[level] = (...args: any[]) => {
            debug(fLevel, ...args);
        };
    }

    return logger;
}

export function newTestSlice(request: i.SliceRequest = {}): i.Slice {
    return {
        slice_id: newId('slice-id'),
        slicer_id: random(0, 99999),
        slicer_order: random(0, 99999),
        request,
        _created: new Date().toISOString(),
    };
}

export function newTestJobConfig(defaults: Partial<i.JobConfig> = {}) {
    return Object.assign({
        name: 'test-job',
        apis: [],
        operations: [],
        analytics: false,
        assets: [],
        lifecycle: 'once',
        max_retries: 0,
        probation_window: 30000,
        recycle_worker: 0,
        slicers: 1,
        workers: 1,
    }, defaults) as i.ValidatedJobConfig;
}

export function newTestExecutionConfig(jobConfig: Partial<i.JobConfig> = {}): i.ExecutionConfig {
    const exConfig = newTestJobConfig(jobConfig) as i.ExecutionConfig;
    exConfig.slicer_hostname = 'example.com';
    exConfig.slicer_port = random(8000, 60000);
    exConfig.ex_id = newId('ex-id');
    exConfig.job_id = newId('job-id');
    return exConfig;
}

/**
 * Create a new Execution Context
 * @deprecated use the new WorkerExecutionContext and SlicerExecutionContext
*/
export function newTestExecutionContext(type: i.Assignment, config: i.ExecutionConfig): i.LegacyExecutionContext {
    if (type === 'execution_controller') {
        return {
            config,
            queue: [],
            reader: null,
            slicer: () => {},
            dynamicQueueLength: false,
            queueLength: 10000,
            reporter: null,
        };
    }

    return {
        config,
        queue: config.operations.map(() => () => {}),
        reader: () => {},
        slicer: () => {},
        dynamicQueueLength: false,
        queueLength: 10000,
        reporter: null,
    };
}

interface ClientFactoryFns {
    [prop: string]: i.ClientFactoryFn;
}

export interface CachedClients {
    [prop: string]: any;
}

export interface TestClientConfig {
    type: string;
    create: i.ClientFactoryFn;
    config?: object;
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

function setConnectorConfig<T extends Object>(sysconfig: i.SysConfig, opts: GetKeyOpts, config: T, override = true): T {
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
    clients?: TestClientConfig[];
}

const _cachedClients = new WeakMap<TestContext, CachedClients>();
const _createClientFns = new WeakMap<TestContext, ClientFactoryFns>();

export class TestContext implements i.Context {
    logger: i.Logger;
    sysconfig: i.SysConfig;
    apis: TestContextAPIs|i.WorkerContextAPIs|i.ContextAPIs;
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

        const sysconfig: i.SysConfig = {
            terafoundation: {
                connectors: {
                    elasticsearch: {
                        default: {}
                    }
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
                state: {
                    connection: 'default'
                },
                worker_disconnect_timeout: 3000,
                workers: 1,
            },
        };

        this.sysconfig = sysconfig;

        // tslint:disable-next-line
        const ctx = this;
        _cachedClients.set(this, {});
        _createClientFns.set(this, {});

        this.apis = {
            foundation: {
                makeLogger(...params: any[]): i.Logger {
                    return debugLogger(testName, ...params);
                },
                getConnection(options: i.ConnectionConfig): { client: any } {
                    const { cached } = options;

                    const cachedClients = _cachedClients.get(ctx) || {};
                    const key = getKey(options);
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

                    const config = setConnectorConfig(sysconfig, options, {}, false);

                    const client = create(config, logger, options);

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
                    const { create, config = {} } = clientConfig;

                    const clientFns = _createClientFns.get(ctx) || {};

                    const key = getKey(clientConfig);
                    if (!isFunction(create)) {
                        const actual = getTypeOf(create);
                        throw new Error(`Test Client for connection "${key}" is not a function, got ${actual}`);
                    }

                    logger.trace(`Setting test client for connection "${key}"`, config);

                    clientFns[key] = create;
                    _createClientFns.set(ctx, clientFns);

                    const cachedClients = _cachedClients.get(ctx) || {};
                    delete cachedClients[key];
                    _cachedClients.set(ctx, cachedClients);

                    setConnectorConfig(sysconfig, clientConfig, config, true);
                });
            },
            getTestClients(): TestClients {
                const cachedClients = _cachedClients.get(ctx) || {};
                const clients = {};

                Object.keys(cachedClients)
                    .forEach((key) => {
                        const [type, endpoint] = key.split(':') as [string, string];
                        if (clients[type] == null) {
                            clients[type] = {};
                        }
                        clients[type][endpoint] = cachedClients[key];
                    });

                return clients;
            }
        } as TestContextAPIs;

        this.foundation = {
            getConnection: this.apis.foundation.getConnection,
            getEventEmitter: this.apis.foundation.getSystemEvents,
            makeLogger: this.apis.foundation.makeLogger,
        };

        this.apis.setTestClients(options.clients);
    }
}
