import { DataEntityList, DataListInput } from './data-entity';
import FetcherCore from './core/fetcher-core';

/**
 * The simpliest varient of "Fetcher"
 */

export default abstract class Fetcher extends FetcherCore {
    /**
     * A method called by {@link Fetcher#handle}
     * @returns a DataEntity compatible list
    */
    abstract async fetch(sliceRequest?: any): Promise<DataListInput>;

    async handle(sliceRequest?: any): Promise<DataEntityList> {
        return this.toDataEntityList(await this.fetch(sliceRequest));
    }
}
