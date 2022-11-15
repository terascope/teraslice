import { BatchProcessor } from '@terascope/job-components';

export default class ExampleBatchProcessor extends BatchProcessor {
    onBatch(batch) {
        return batch.map((data) => {
            data.batchedAt = new Date().toISOString();
            return data;
        });
    }
}
