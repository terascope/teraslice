import ManagerPlugin from './manager';
import SearchPlugin from './search';
import { PluginConfig } from './interfaces';

const adapter: TeraserverPluginAdapter = {
    _initialized: false,
    _manager: undefined,
    _search: undefined,
    _config: undefined,

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

    routes() {
        if (this._manager == null
            || this._search == null
            || this._config == null) {
            throw new Error('Plugin has not been configured');
        }

        if (!this._initialized) {
            throw new Error('Plugin has not been initialized');
        }

        this._manager.registerRoutes();
        this._search.registerRoutes();
    },
};

export = adapter;

interface TeraserverPluginAdapter {
    _config?: PluginConfig;
    _manager?: ManagerPlugin;
    _search?: SearchPlugin;
    _initialized: boolean;

    config(config: PluginConfig): void;
    init(): Promise<void>;
    routes(): void;
}
