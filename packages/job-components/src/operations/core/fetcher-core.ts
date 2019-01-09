import { DataEntity } from '@terascope/utils';
import { OpConfig } from '../../interfaces';
import OperationCore from './operation-core';

/**
 * A base class for supporting "Fetcher" that run on a "Worker".
 * The "Fetcher" is a part of the "Reader" component of a job.
 * @see OperationCore
 */

export default abstract class FetcherCore<T = OpConfig> extends OperationCore<T> {
    /**
    * A generic method called by the Teraslice framework to a give a "Fetcher"
    * the ability to handle the fetch operation
    */
    abstract async handle(sliceRequest?: any): Promise<DataEntity[]>;
}
