import { OpAPI, OperationAPIConstructor } from './operations/operation-api';
import legacySliceEventsShim from './operations/shims/legacy-slice-events-shim';
import { Context, ExecutionConfig } from './interfaces';

const _registry = new WeakMap();
const _apis = new WeakMap();

export class ExecutionContextAPI {
    private _context: Context;
    private _executionConfig: ExecutionConfig;

    constructor(context: Context, executionConfig: ExecutionConfig) {
        this._context = context;
        this._executionConfig = executionConfig;
        _registry.set(this, {});
        _apis.set(this, {});
    }

    addToRegistry(name: string, api: OperationAPIConstructor) {
        const registry = this.registery;
        registry[name] = api;
        _registry.set(this, registry);
    }

    get registery(): APIRegistry {
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
        if (this.registery[name] == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }

        if (this.apis[name] != null) {
            throw new Error(`API "${name}" can only be initalized once`);
        }

        const API = this.registery[name];
        const api = new API(this._context, this._executionConfig);
        await api.initialize();

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
