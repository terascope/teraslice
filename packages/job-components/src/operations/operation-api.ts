import { OperationCore } from './core/operation-core';

/**
 * OperationAPI [DRAFT]
 * @description One of the main types of an Operation for creating API exposed to other Operations.
 */

export abstract class OperationAPI extends OperationCore {
    // The createAPI method can be called many times
    // and a new instances will be returned each time.
    // The developer of the API is in-charge of caching
    // the API for subsequence calls to create.
    abstract async createAPI(config?: object): Promise<OpAPI>;

    // this method is called by the teraslice framework and should not be overwritten
    async handle(config?: object): Promise<OpAPI> {
        return this.createAPI(config);
    }
}

export type OpAPIFn = Function;
export type OpAPIInstance = { [method: string]: Function };
export type OpAPI = OpAPIFn | OpAPIInstance;
