import ManagerPlugin from './manager';
import SearchPlugin from './search';
import QueryPointPlugin from './query-point';
import { PluginConfig } from './interfaces';

const adapter: TeraserverPluginAdapter = {
    _initialized: false,
    _manager: undefined,
    _search: undefined,
    _queryPoint: undefined,
    _config: undefined,

    config_schema() {
        return {
            connection: {
                doc: 'Elasticsearch cluster where users, roles, query-point and views are stored',
                default: 'default',
                format(val: any) {
                    if (typeof val !== 'string') {
                        throw new Error('connection parameter must be of type String as the value');
                    }
                },
            },
            namespace: {
                doc: 'Elasticsearch index namespace for the data-access models',
                default: false,
            },
        };
    },

    config(config: PluginConfig) {
        this._manager = new ManagerPlugin(config);
        this._search = new SearchPlugin(config);
        this._queryPoint = new QueryPointPlugin(config);
        this._config = config;
    },

    async init() {
        if (this._manager == null || this._search == null || this._queryPoint == null) {
            throw new Error('Plugin has not been configured');
        }

        await Promise.all([
            this._manager.initialize(),
            this._search.initialize(),
            this._queryPoint.initialize()
        ]);
        this._initialized = true;
    },

    post() {
        if (this._search == null) {
            throw new Error('Plugin has not been configured');
        }

        if (!this._initialized) {
            throw new Error('Plugin has not been initialized');
        }

        this._search.registerRoutes();
    },

    routes(_deferred) {
        if (this._manager == null
            || this._search == null
            || this._queryPoint == null
            || this._config == null
        ) {
            throw new Error('Plugin has not been configured');
        }

        if (!this._initialized) {
            throw new Error('Plugin has not been initialized');
        }

        // ORDER MATTERS
        this._manager.registerRoutes();
        this._queryPoint.registerRoutes();
        this._search.registerMiddleware();
    },
};

export = adapter;

interface TeraserverPluginAdapter {
    _config?: PluginConfig;
    _manager?: ManagerPlugin;
    _search?: SearchPlugin;
    _queryPoint?: QueryPointPlugin;
    _initialized: boolean;

    // eslint-disable-next-line
    config_schema(): any;
    config(config: PluginConfig): void;
    post(): void;
    init(): Promise<void>;
    routes(deferred: (() => void)[]): void;
}
