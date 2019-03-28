import ManagerPlugin from './manager';
import SearchPlugin from './search';
import { PluginConfig } from './interfaces';

const adapter: TeraserverPluginAdapter = {
    _initialized: false,
    _manager: undefined,
    _search: undefined,
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
            bootstrap_mode: {
                doc: 'Enabling this flag will cause a SUPERADMIN user to be created ' +
                    'when this plugin is initialized and there are no other users. ' +
                    'The SUPERADMIN\'s credentials are (username: admin, password: admin). ' +
                    'Make sure to only run one worker when using this mode. ' +
                    'Remember to change the auto-created user\'s password since the default is secure.',
                default: false,
            }
        };
    },

    config(config: PluginConfig) {
        this._manager = new ManagerPlugin(config);
        this._search = new SearchPlugin(config);
        this._config = config;
    },

    async init() {
        if (this._manager == null || this._search == null) {
            throw new Error('Plugin has not been configured');
        }

        return Promise.all([
            this._manager.initialize(),
            this._search.initialize(),
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

        this._search.registerRoutes();
    },

    routes() {
        if (this._manager == null
            || this._config == null) {
            throw new Error('Plugin has not been configured');
        }

        if (!this._initialized) {
            throw new Error('Plugin has not been initialized');
        }

        this._manager.registerRoutes();
    },
};

export = adapter;

interface TeraserverPluginAdapter {
    _config?: PluginConfig;
    _manager?: ManagerPlugin;
    _search?: SearchPlugin;
    _initialized: boolean;

    config_schema(): any;
    config(config: PluginConfig): void;
    post(): void;
    init(): Promise<void>;
    routes(): void;
}
