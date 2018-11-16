import { BatchProcessor, DataEntity } from '../../operations';

export default class Noop<T = object> extends BatchProcessor<T> {
    async onBatch(data: DataEntity[]) {
        return data;
    }
}
