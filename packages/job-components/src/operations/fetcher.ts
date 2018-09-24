import { DataEntityList, DataListInput } from './data-entity';
import { FetcherCore } from './core/fetcher-core';

/**
 * The simpliest varient of "Fetcher"
 * @see FetcherCore
 */

export abstract class Fetcher extends FetcherCore {
    /**
     * A method called by {@link Fetcher#handle}
     * @returns a DataEntity compatible list
    */
    abstract async fetch(sliceRequest?: any): Promise<DataListInput>;

    /**
    * A generic method called by the Teraslice framework.
    * This will call {@link #fetch} method.
    * @see FetcherCore#handle
    */
    async handle(sliceRequest?: any): Promise<DataEntityList> {
        return this.toDataEntityList(await this.fetch(sliceRequest));
    }
}
