import { APICore, OpAPI, OpAPIInstance, OpAPIFn } from './core/api-core';

/**
 * @see APICore
 */

export abstract class OperationAPI extends APICore {
    /**
     * @see APICore#name
    */
    abstract name(): string;

    /**
     * @see APICore#handle
    */
    abstract async handle(...params: any[]): Promise<OpAPI>;
}

export { OpAPI, OpAPIInstance, OpAPIFn };
