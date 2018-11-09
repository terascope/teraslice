import { TestReaderConfig } from './interfaces';
import { Fetcher } from '../../operations';

export default class TestFetcher<T = TestReaderConfig>  extends Fetcher<T> {
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
