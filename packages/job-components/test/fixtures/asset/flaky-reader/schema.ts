import { BaseSchema } from '../../../../src/index.js';

export default class Schema extends BaseSchema<any, any> {
    build(): Record<string, any> {
        return {
            // How many times this fetcher should throw before succeeding.
            // Set to a number higher than max_retries to simulate total failure.
            fail_times: {
                default: 0,
                doc: 'Number of times fetch() will throw before returning results',
                format: 'nat',
            }
        };
    }
}
