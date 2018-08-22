import { OperationCore } from './operation-core';

export type OpAPIFn = Function;
export type OpAPIInstance = { [method: string]: Function };
export type OpAPI = OpAPIFn | OpAPIInstance;

/**
 * OperationAPI Base Class [DRAFT]
 * @description A base class for specifying an API that other operations can use.
 *              The createAPI method can be called many times,
 *              it is up to the class to support caching the returned API.
 */

export class OperationAPI extends OperationCore {
    // @ts-ignore
    public async createAPI(config?: object): Promise<OpAPI> {
        throw new Error('OperationAPI must implement a "createAPI" method');
    }
}
