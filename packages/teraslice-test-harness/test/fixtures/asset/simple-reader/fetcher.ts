import { SimpleReaderConfig } from './interfaces';
import { Fetcher } from '@terascope/job-components';

export default class TestFetcher<T = SimpleReaderConfig>  extends Fetcher<T> {
    async fetch() {
        const result = Array(10);
        for (let i = 0; i < 10; i++) {
            result[i] = {
                id: i,
                data: [
                    Math.random(),
                    Math.random(),
                    Math.random(),
                ]
            };
        }
        return result;
    }
}
