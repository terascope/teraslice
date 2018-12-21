import { OpAPI, APIConfig } from '../interfaces';
import APICore from './core/api-core';

/**
 * An API factory class for operations
 */
export default abstract class OperationAPI<T = APIConfig> extends APICore<T> {
     /**
     * Called when the API is created with in another Operation.
     * This will only be called once during an operation
     * @returns an Operation API which is one of the following
     *           - an object with function properties
     *           - an instances of a class
     *           - a function
     */
    abstract async createAPI(...params: any[]): Promise<OpAPI>;
}
