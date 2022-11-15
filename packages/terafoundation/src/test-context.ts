import {
    AnyObject, PartialDeep, get,
    isString, isFunction, getTypeOf
} from '@terascope/utils';
import { nanoid } from 'nanoid';
import * as i from './interfaces.js';
import { CoreContext } from './core-context.js';
import validateConfigs from './validate-configs.js';

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
    if (!isString(type)) throw new Error('A type must be specified when registering a Client');
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

const _cachedClients = new WeakMap<TestContext<AnyObject, AnyObject>, CachedClients>();
const _createClientFns = new WeakMap<TestContext<AnyObject, AnyObject>, ClientFactoryFns>();

export interface TestContextOptions<S> {
    name?: string;
    assignment?: any;
    clients?: TestClientConfig[];
    sysconfig?: PartialDeep<i.FoundationSysConfig<S>>;
}

function getDefaultSysconfig<S>(
    options: TestContextOptions<S>
): PartialDeep<i.FoundationSysConfig<S>> {
    return {
        terafoundation: {
            connectors: {
                'elasticsearch-next': {
                    default: {},
                },
            },
            ...get(options.sysconfig, 'terafoundation', {})
        },
        ...options.sysconfig
    };
}

export class TestContext<
    S extends AnyObject,
    A extends AnyObject,
    D extends string = string,
> extends CoreContext<S, A & TestContextAPIs, D> {
    readonly options: TestContextOptions<S>;

    constructor(options: TestContextOptions<S> = {}) {
        const config: i.FoundationConfig<S, A & TestContextAPIs, D> = {
            name: options.name || 'test-context',
        };
        const cluster: i.Cluster = {
            isMaster: false,
            worker: {
                id: nanoid(8),
            }
        } as any;
        super(config, cluster);
        this.options = options;
    }

    async init() {
        const { options } = this;
        const sysconfig = getDefaultSysconfig(options);
        // @ts-expect-error only set for TestContext
        this.sysconfig = sysconfig;

        await super.init();

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const ctx = this as any;
        _cachedClients.set(ctx, {});
        _createClientFns.set(ctx, {});

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

        this.apis.setTestClients = (clients: TestClientConfig[] = []) => {
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

        if (options.clients) {
            this.apis.setTestClients(options.clients);
        }
    }
}
