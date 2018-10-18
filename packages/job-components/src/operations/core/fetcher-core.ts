import { DataEntityList } from '../data-entity';
import OperationCore from './operation-core';
import { Context, OpConfig, ExecutionConfig } from '../../interfaces';

/**
 * A base class for supporting "Fetcher" that run on a "Worker".
 * The "Fetcher" is a part of the "Reader" component of a job.
 * @see OperationCore
 */

export default abstract class FetcherCore extends OperationCore {
    /**
    * A generic method called by the Teraslice framework to a give a "Fetcher"
    * the ability to handle the fetch operation
    */
    abstract async handle(sliceRequest?: any): Promise<DataEntityList>;
}

export type FetcherConstructor = {
    new(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig): FetcherCore;
};
