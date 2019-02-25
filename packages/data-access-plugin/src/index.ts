import TeraserverPlugin from './teraserver';
import { PluginConfig } from './interfaces';

const adapter: TeraserverPluginAdapter = {
    _initialized: false,
    _instance: undefined,
    _config: undefined,

    config(config: PluginConfig) {
        this._instance = new TeraserverPlugin(config);
        this._config = config;
    },

    init() {
        if (this._instance == null) {
            throw new Error('Plugin has not been configured');
        }

        return this._instance.initialize().then(() => {
            this._initialized = true;
        });
    },

    routes() {
        if (this._instance == null || this._config == null) {
            throw new Error('Plugin has not been configured');
        }

        if (!this._initialized) {
            throw new Error('Plugin has not been initialized');
        }

        this._instance.registerRoutes();
    },
};

export = adapter;

interface TeraserverPluginAdapter {
    _config?: PluginConfig;
    _instance?: TeraserverPlugin;
    _initialized: boolean;

    config(config: PluginConfig): void;
    init(): Promise<void>;
    routes(): void;
}
