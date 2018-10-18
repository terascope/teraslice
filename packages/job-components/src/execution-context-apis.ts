import { OpAPI, OperationAPIConstructor } from './operations/operation-api';
import legacySliceEventsShim from './operations/shims/legacy-slice-events-shim';
import { Context, ExecutionConfig } from './interfaces';

const _registry = new WeakMap();
const _apis = new WeakMap();
const _config = new WeakMap();

export class ExecutionContextAPI {
    constructor(context: Context, executionConfig: ExecutionConfig) {
        _config.set(this, {
            context,
            executionConfig,
            events: context.apis.foundation.getSystemEvents(),
        });

        _registry.set(this, {});
        _apis.set(this, {});
    }

    addToRegistry(name: string, api: OperationAPIConstructor) {
        const registry = this.registry;
        registry[name] = api;
        _registry.set(this, registry);
    }

    get registry(): APIRegistry {
        return _registry.get(this);
    }

    get apis(): APIS {
        return _apis.get(this);
    }

    getAPI(name: string) {
        if (this.apis[name] == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }
        return this.apis[name];
    }

    async initAPI(name: string, ...params: any[]) {
        const config = _config.get(this);
        if (this.registry[name] == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }

        if (this.apis[name] != null) {
            throw new Error(`API "${name}" can only be initalized once`);
        }

        const API = this.registry[name];

        const api = new API(config.context, config.executionConfig);
        await api.initialize();

        config.events.emit('execution:add-to-lifecycle', api);

        legacySliceEventsShim(api);

        this.apis[name] = await api.createAPI(...params);
        return this.apis[name];
    }
}

interface APIS {
    [name: string]: OpAPI;
}

interface APIRegistry {
    [name: string]: OperationAPIConstructor;
}
