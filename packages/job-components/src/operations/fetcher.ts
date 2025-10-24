import { DataEntity, DataArrayInput } from '@terascope/entity-utils';
import { OpConfig } from '../interfaces/index.js';
import FetcherCore from './core/fetcher-core.js';

/**
 * The simpliest varient of "Fetcher"
 */

export default abstract class Fetcher<T = OpConfig> extends FetcherCore<T> {
    /**
     * A method called by {@link Fetcher#handle}
     * @returns a DataEntity compatible array
    */
    abstract fetch(sliceRequest?: unknown): Promise<DataArrayInput>;

    async handle(sliceRequest?: unknown): Promise<DataEntity[]> {
        return DataEntity.makeArray(await this.fetch(sliceRequest));
    }
}
