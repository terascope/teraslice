import ManagerPlugin from './manager';
import SearchPlugin from './search';
import SpacesPlugin from './spaces';
import { PluginConfig } from './interfaces';

const adapter: TeraserverPluginAdapter = {
    _initialized: false,
    _manager: undefined,
    _search: undefined,
    _spaces: undefined,
    _config: undefined,

    config_schema() {
        return {
            connection: {
                doc: 'Elasticsearch cluster where users, roles, spaces and views are stored',
                default: 'default',
                format(val: any) {
                    if (typeof val !== 'string') {
                        throw new Error('connection parameter must be of type String as the value');
                    }
                }
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
        this._spaces = new SpacesPlugin(config);
        this._config = config;
    },

    async init() {
        if (this._manager == null || this._search == null || this._spaces == null) {
            throw new Error('Plugin has not been configured');
        }

        return Promise.all([
            this._manager.initialize(),
            this._search.initialize(),
            this._spaces.initialize(),
        ])
            .then(() => {
                this._initialized = true;
            });
    },

    post() {
        if (this._search == null) {
            throw new Error('Plugin has not been configured');
        }

        if (!this._initialized) {
            throw new Error('Plugin has not been initialized');
        }

        this._search.postRegistration();
    },

    routes() {
        if (this._manager == null
            || this._search == null
            || this._spaces == null
            || this._config == null) {
            throw new Error('Plugin has not been configured');
        }

        if (!this._initialized) {
            throw new Error('Plugin has not been initialized');
        }

        // ORDER MATTERS
        this._manager.registerRoutes();
        this._spaces.registerRoutes();
        this._search.registerRoutes();
    },
};

export = adapter;

interface TeraserverPluginAdapter {
    _config?: PluginConfig;
    _manager?: ManagerPlugin;
    _search?: SearchPlugin;
    _spaces?: SpacesPlugin;
    _initialized: boolean;

    config_schema(): any;
    config(config: PluginConfig): void;
    post(): void;
    init(): Promise<void>;
    routes(): void;
}
