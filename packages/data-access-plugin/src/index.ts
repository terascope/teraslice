import { Router } from 'express';
import TeraserverPlugin from './teraserver';
import { PluginConfig } from './interfaces';

class TeraserverPluginAdapter {
    _instance: TeraserverPlugin|undefined;
    _config: PluginConfig|undefined;
    _initialized: boolean = false;

    config(config: PluginConfig) {
        this._instance = new TeraserverPlugin(config);
        this._config = config;
    }

    async init() {
        if (this._instance == null) {
            throw new Error('Plugin has not been configured');
        }

        await this._instance.initialize();
        this._initialized = true;
    }

    routes() {
        if (this._instance == null || this._config == null) {
            throw new Error('Plugin has not been configured');
        }

        if (!this._initialized) {
            throw new Error('Plugin has not been initialized');
        }

        const {
            url_base: baseUrl
        } = this._config;

        const router = Router();
        this._instance.registerRoutes(router);

        this._instance.app.use(baseUrl, router);
    }
}

export = new TeraserverPluginAdapter();
