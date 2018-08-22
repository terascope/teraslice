import { OperationCore } from './operation-core';

export type OpAPIFn = Function;
export type OpAPIInstance = { [method: string]: Function };
export type OpAPI = OpAPIFn | OpAPIInstance;

export class OperationAPI extends OperationCore {
    // @ts-ignore
    public async createAPI(config?: object): Promise<OpAPI> {
        throw new Error('OperationAPI must implement a "createAPI" method');
    }
}
