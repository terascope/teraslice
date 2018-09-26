import { OpAPI, OperationAPIConstructor } from './operations/operation-api';
import legacySliceEventsShim from './operations/shims/legacy-slice-events-shim';
import { Context, ExecutionConfig } from '@terascope/teraslice-types';

export class ExecutionContextAPI {
    private _registery: APIRegistry = {};
    private _apis: APIS = {};
    private _context: Context;
    private _executionConfig: ExecutionConfig;

    constructor(context: Context, executionConfig: ExecutionConfig) {
        this._context = context;
        this._executionConfig = executionConfig;
    }

    addToRegistry(name: string, api: OperationAPIConstructor) {
        this._registery[name] = api;
    }

    getAPI(name: string) {
        if (this._apis[name] == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }
        return this._apis[name];
    }

    async initAPI(name: string, ...params: any[]) {
        if (this._registery[name] == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }

        if (this._apis[name] != null) {
            throw new Error(`API "${name}" can only be initalized once`);
        }

        const API = this._registery[name];
        const api = new API(this._context, this._executionConfig);
        await api.initialize();

        legacySliceEventsShim(api);

        this._apis[name] = await api.createAPI(...params);
        return this._apis[name];
    }
}

interface APIS {
    [name: string]: OpAPI;
}

interface APIRegistry {
    [name: string]: OperationAPIConstructor;
}
