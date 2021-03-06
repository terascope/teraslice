import * as ts from '@terascope/utils';
import { nanoid } from 'nanoid';
import * as i from './interfaces';
import { CoreContext } from './core-context';
import validateConfigs from './validate-configs';

interface ClientFactoryFns {
    [prop: string]: i.ClientFactoryFn;
}

export interface CachedClients {
    [prop: string]: any;
}

export interface TestClientConfig {
    type: string;
    create: i.ClientFactoryFn;
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

const _cachedClients = new WeakMap<TestContext, CachedClients>();
const _createClientFns = new WeakMap<TestContext, ClientFactoryFns>();

export interface TestContextOptions<S> {
    name?: string;
    assignment?: any;
    clients?: TestClientConfig[];
    sysconfig?: ts.PartialDeep<i.FoundationSysConfig<S>>;
}

export class TestContext<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string,
> extends CoreContext<S, A & TestContextAPIs, D> {
    constructor(options: TestContextOptions<S> = {}) {
        const sysconfig: ts.PartialDeep<i.FoundationSysConfig<S>> = {
            terafoundation: {
                connectors: {
                    elasticsearch: {
                        default: {},
                    },
                },
                ...ts.get(options.sysconfig, 'terafoundation', {})
            },
            ...options.sysconfig
        };

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

        this.apis.setTestClients = (clients: TestClientConfig[] = []) => {
            clients.forEach((clientConfig) => {
                const { create, config: connectionConfig = {} } = clientConfig;

                const clientFns = _createClientFns.get(ctx) || {};

                const key = getKey(clientConfig);
                if (!ts.isFunction(create)) {
                    const actual = ts.getTypeOf(create);
                    throw new Error(`Test Client for connection "${key}" is not a function, got ${actual}`);
                }

                ctx.logger.trace(`Setting test client for connection "${key}"`, connectionConfig);

                clientFns[key] = create;
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
