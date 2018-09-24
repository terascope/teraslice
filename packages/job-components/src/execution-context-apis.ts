import { OpAPI } from './operations/operation-api';

export class ExecutionContextAPI {
    private _apis: APIS = {};

    register(name: string, fn: (...params: any[]) => OpAPI) {
        this._apis[name] = fn;
    }

    async create(name: string, ...params: any[]) {
        if (this._apis[name] == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }
        return this._apis[name](...params);
    }
}

interface APIS {
    [name: string]: (...params: any[]) => OpAPI;
}
