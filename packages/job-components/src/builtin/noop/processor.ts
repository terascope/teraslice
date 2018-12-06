import { BatchProcessor, DataEntity } from '../../operations';

export default class Noop extends BatchProcessor {
    async onBatch(data: DataEntity[]) {
        return data;
    }
}
