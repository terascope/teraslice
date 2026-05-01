import { DataEntity } from '@terascope/core-utils';
import { Fetcher } from '../../../../src/index.js';

/**
 * A fetcher that throws a set number of times before succeeding.
 * Controlled by the `fail_times` op config option.
 *
 * Example: fail_times: 2 means the first 2 calls throw, the 3rd succeeds.
 */
export default class FlakyFetcher extends Fetcher {
    private attempts = 0;

    async fetch(): Promise<DataEntity[]> {
        this.attempts++;

        if (this.attempts <= this.opConfig.fail_times) {
            throw new Error(`intentional failure on attempt ${this.attempts}`);
        }

        return DataEntity.makeArray([{ hello: true }]);
    }
}
