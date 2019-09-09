import { DataEntity } from './data-entity';

/**
 * Acts as an array of DataEntities associated to a particular key or time frame.
 * A `DataWindow` should be able to be used in-place of an array in most cases.
 */
export class DataWindow<T extends DataEntity> extends Array<T> {
    getMetadata() {}

    setMetadata() {}

    getKey() {}

    setKey() {}

    getCreateTime() {}

    getStartTime() {}

    setStartTime() {}

    getFinishTime() {}

    setFinishTime() {}
}
