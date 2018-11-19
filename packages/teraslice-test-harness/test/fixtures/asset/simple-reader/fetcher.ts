import { SimpleReaderConfig } from './interfaces';
import times from 'lodash/times';
import { Fetcher, SliceRequest } from '@terascope/job-components';

export default class TestFetcher extends Fetcher<SimpleReaderConfig> {
    async fetch(request: SliceRequest) {
        return times(request.count, (i) => {
            return {
                id: i,
                data: [
                    Math.random(),
                    Math.random(),
                    Math.random(),
                ]
            };
        });
    }
}
