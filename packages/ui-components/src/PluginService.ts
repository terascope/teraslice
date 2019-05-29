import { RegisterPluginFn, PluginConfig } from './interfaces';
import { isString, isFunction, isPlainObject } from '@terascope/utils';

class PluginService {
    static make(): PluginService {
        // @ts-ignore
        if (window.PluginService) return window.PluginService;

        const service = new PluginService();
        // @ts-ignore
        window.PluginService = service;
        return service;
    }

    private _registry: { [id: string]: RegisterPluginFn } = {};
    private _plugins: { [id: string]: PluginConfig } = {};

    register(id: string, fn: RegisterPluginFn) {
        if (!id || !isString(id)) {
            throw new Error('Unable to register plugin, id must be a string');
        }
        if (!isFunction(fn)) {
            throw new Error('Unable to register plugin, plugin must be a function');
        }
        if (this._registry[id] != null) {
            throw new Error(`Unable to register plugin, plugin already exists with id "${id}"`);
        }

        this._registry[id] = fn;
        // tslint:disable-next-line: no-console
        console.info(`Registered plugin "${id}"`);
    }

    plugins(): PluginConfig[] {
        for (const [id, fn] of Object.entries(this._registry)) {
            if (this._plugins[id] == null) {
                const config = fn();
                if (!isPlainObject(config) || config.name == null || !config.routes) {
                    console.error(`Plugin ${id} is not configured correctly, got`, config);
                } else {
                    this._plugins[id] = config;
                }
            }
        }

        return Object.values(this._plugins);
    }
}

export default PluginService.make();
