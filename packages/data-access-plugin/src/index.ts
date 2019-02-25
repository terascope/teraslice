import ManagerPlugin from './manager';
import { PluginConfig } from './interfaces';

const adapter: TeraserverPluginAdapter = {
    _initialized: false,
    _manager: undefined,
    _config: undefined,

    config(config: PluginConfig) {
        this._manager = new ManagerPlugin(config);
        this._config = config;
    },

    init() {
        if (this._manager == null) {
            throw new Error('Plugin has not been configured');
        }

        return this._manager.initialize().then(() => {
            this._initialized = true;
        });
    },

    routes() {
        if (this._manager == null || this._config == null) {
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
    _initialized: boolean;

    config(config: PluginConfig): void;
    init(): Promise<void>;
    routes(): void;
}
