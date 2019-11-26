
import { Fetcher, SliceRequest, AnyObject } from '@terascope/job-components';

export default class TestFetcher extends Fetcher<AnyObject> {
    async fetch(request: SliceRequest) {
        return request;
    }
}
