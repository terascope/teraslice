import {
    isString, get, isFunction,
    getTypeOf
} from '@terascope/core-utils';
import type { Terafoundation, PartialDeep } from '@terascope/types';
import { nanoid } from 'nanoid';
import { CoreContext } from './core-context.js';
import validateConfigs from './validate-configs.js';
import { PromMetrics } from './api/prom-metrics/prom-metrics-api.js';

interface ClientFactoryFns {
    [prop: string]: Terafoundation.CreateClientFactoryFn;
}

export interface CachedClients {
    [prop: string]: any;
}

export interface TestClientConfig {
    type: string;
    createClient?: Terafoundation.CreateClientFactoryFn;
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
    if (!isString(type)) throw new Error('A type must be specified when registering a Client');
    return `${type}:${endpoint}`;
}

function setConnectorConfig<T extends Record<string, any>>(
    sysconfig: Terafoundation.SysConfig<Record<string, any>>,
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

const _cachedClients = new WeakMap<
    TestContext<Record<string, any>, Record<string, any>>,
    CachedClients
>();
const _createClientFns = new WeakMap<
    TestContext<Record<string, any>, Record<string, any>>,
    ClientFactoryFns
>();

export interface TestContextOptions<S> {
    name?: string;
    assignment?: any;
    clients?: TestClientConfig[];
    sysconfig?: PartialDeep<Terafoundation.SysConfig<S>>;
}

function getDefaultSysconfig<S>(
    options: TestContextOptions<S>
): PartialDeep<Terafoundation.SysConfig<S>> {
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
            ...get(options.sysconfig, 'terafoundation', {})
        },
        ...options.sysconfig
    };
}

export class TestContext<
    S extends Record<string, any>,
    A extends Record<string, any>,
    D extends string = string,
> extends CoreContext<S, A & TestContextAPIs, D> {
    constructor(
        config: Terafoundation.Config<S, A & TestContextAPIs, D>,
        cluster: any,
        sysconfig: Terafoundation.SysConfig<S>
    ) {
        super(config, cluster, sysconfig);

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const ctx = this;
        _cachedClients.set(this, {});
        _createClientFns.set(this, {});

        this.apis.foundation.createClient = async (opts: Terafoundation.ConnectionConfig) => {
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
        };

        this.apis.foundation.promMetrics = new PromMetrics(ctx.logger);

        this.apis.setTestClients = (clients: TestClientConfig[] = []) => {
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
        };

        this.apis.getTestClients = () => {
            const cachedClients = _cachedClients.get(ctx) || {};
            const clients: TestClients = {};

            Object.keys(cachedClients).forEach((key) => {
                const [type, endpoint] = key.split(':', 2) as [string, string];
                if (clients[type] == null) {
                    clients[type] = {};
                }
                clients[type][endpoint] = cachedClients[key];
            });

            return clients;
        };
    }

    static async createContext<
        S extends Record<string, any>,
        A extends Record<string, any>,
        D extends string = string,
    >(options: TestContextOptions<S> = {}, schema: any = {}) {
        const defaultSysconfig = getDefaultSysconfig(options);
        const config: Terafoundation.Config<S, A & TestContextAPIs, D> = {
            name: options.name || 'test-context',
            config_schema: schema
        };

        const cluster: Terafoundation.Cluster = {
            isMaster: false,
            worker: {
                id: nanoid(8),
            }
        } as any;

        const sysConfig = await validateConfigs(cluster, config, defaultSysconfig);
        const context = new TestContext<S, A, D>(config, cluster, sysConfig);

        if (options.clients) {
            context.apis.setTestClients(options.clients);
        }

        return context;
    }
}
