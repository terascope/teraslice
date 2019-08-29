import { DataEntity, DataArrayInput } from '@terascope/utils';
import { OpConfig } from '../interfaces';
import FetcherCore from './core/fetcher-core';

/**
 * The simpliest varient of "Fetcher"
 */

export default abstract class Fetcher<T = OpConfig> extends FetcherCore<T> {
    /**
     * A method called by {@link Fetcher#handle}
     * @returns a DataEntity compatible array
    */
    abstract async fetch(sliceRequest?: any): Promise<DataArrayInput>;

    async handle(sliceRequest?: any): Promise<DataEntity[]> {
        return DataEntity.makeArray(await this.fetch(sliceRequest));
    }
}
