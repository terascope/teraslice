import APICore, { OpAPI, OpAPIInstance, OpAPIFn } from './core/api-core';

/**
 * An API factory class for operations
 */
export default abstract class OperationAPI extends APICore {
    abstract name(): string;
    abstract async handle(...params: any[]): Promise<OpAPI>;
}

export { OpAPI, OpAPIInstance, OpAPIFn };
