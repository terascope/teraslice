import { BatchProcessor } from '@terascope/job-components';

const defaultResults = Array.from(Array(10)).map(() => ({ hi: true }));

export default class ExampleBatch extends BatchProcessor {
    async onBatch(_batch: any[]) {
        const errorAt = this.opConfig.errorAt ?? [];

        // @ts-expect-error
        if (this.context._opCalls == null) {
            // @ts-expect-error
            this.context._opCalls = -1;
        }

        // @ts-expect-error
        this.context._opCalls += 1;
        // @ts-expect-error
        if (errorAt.includes(this.context._opCalls)) {
            return Promise.reject(new Error('Bad news bears'));
        }

        return this.opConfig.results ?? defaultResults;
    }
}
