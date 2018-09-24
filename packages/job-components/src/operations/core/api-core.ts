import { OperationCore } from './operation-core';

/**
 * A base class for supporting APIs that run within an Execution Context.
 * @see OperationCore
 */

export abstract class APICore extends OperationCore {
    /**
     * The name of API which will be used to be registed as within an Execution Context.
    */
    abstract name(): string;

    /**
     * This is called from the Teraslice framework to register the API
     * to make to available to the execution context.
    */
    register() {
        this.context.apis.executionContext.register(this.name(), (...params: any[]) => {
            return this.handle(...params);
        });
    }

     /**
     * Called when the API is created with in another Operation.
     * A new instances will be returned each time, unless the
     * the API handles caching the API for subsequence calls.
     * @returns an Operation API which is one of the following
     *           - an object with function properties
     *           - an instances of a class
     *           - a function
     */
    abstract async handle(...params: any[]): Promise<any>;
}

export type OpAPIFn = Function;
export type OpAPIInstance = {
    [method: string]: Function|any;
};
export type OpAPI = OpAPIFn | OpAPIInstance;
