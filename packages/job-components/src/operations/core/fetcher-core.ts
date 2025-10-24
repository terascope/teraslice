import { DataEntity } from '@terascope/entity-utils';
import { OpConfig } from '../../interfaces/index.js';
import OperationCore from './operation-core.js';

/**
 * A base class for supporting "Fetcher" that run on a "Worker".
 * The "Fetcher" is a part of the "Reader" component of a job.
 * See [[OperationCore]]
 */

export default abstract class FetcherCore<T = OpConfig> extends OperationCore<T> {
    /**
     * A generic method called by the Teraslice framework to a give a "Fetcher"
     * the ability to handle the fetch operation
     */
    abstract handle(sliceRequest?: unknown): Promise<DataEntity[]>;
}
