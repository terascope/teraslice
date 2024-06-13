import { Fetcher } from '@terascope/job-components';

const defaultResults = Array.from(Array(10)).map(() => ({ hi: true }));

export default class ExampleBatch extends Fetcher {
    async fetch() {
        const errorAt = this.opConfig.errorAt ?? [];
        // @ts-expect-error
        if (this.context._readerCalls == null) {
            // @ts-expect-error
            this.context._readerCalls = -1;
        }
        // @ts-expect-error
        this.context._readerCalls += 1;
        // @ts-expect-error
        if (errorAt.includes(this.context._readerCalls)) {
            return Promise.reject(new Error('Bad news bears'));
        }

        return this.opConfig.results ?? defaultResults;
    }
}
