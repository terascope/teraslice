import { BatchProcessor } from '@terascope/job-components';

export default class ExampleBatch extends BatchProcessor {
    async initialize() {
        this.initialized = true;
        this.logger.debug('example map initalized', this.opConfig);
        return super.initialize();
    }

    async shutdown() {
        this.shutdown = true;
        return super.shutdown();
    }

    async onBatch(batch) {
        if (this.opConfig.failOnSliceRetry) {
            throw new Error('Fail slices');
        }

        return batch.map((data) => {
            data.touchedAt = new Date().toISOString();
            return data;
        });
    }

    onSliceRetry() {
        if (this.opConfig.failOnSliceRetry) {
            throw new Error('I will not allow it');
        }
    }
}
