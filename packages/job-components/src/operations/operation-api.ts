import { OperationCore } from './core/operation-core';

/**
 * OperationAPI [DRAFT]
 * @description One of the main types of an Operation for creating API exposed to other Operations.
 */

export abstract class OperationAPI extends OperationCore {
    /**
     * @description This method can be called many times
     *              and a new instances will be returned each time.
     *              The developer of the API is in-charge of caching
     *             the API for subsequence calls to create.
     * @returns an Operation API which is one of the following
     *           - an object with function properties
     *           - an instances of a class
     *           - a function
     */
    abstract async createAPI(config?: object): Promise<OpAPI>;

    /**
     * @description this is called by the Teraslice framework, this calls "->fetch"
    */
    async handle(config?: object): Promise<OpAPI> {
        return this.createAPI(config);
    }
}

export type OpAPIFn = Function;
export type OpAPIInstance = { [method: string]: Function };
export type OpAPI = OpAPIFn | OpAPIInstance;
