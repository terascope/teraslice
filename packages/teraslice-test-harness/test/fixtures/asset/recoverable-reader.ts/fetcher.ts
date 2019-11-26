
import { Fetcher, SliceRequest, AnyObject } from '@terascope/job-components';

export default class TestFetcher extends Fetcher<AnyObject> {
    // @ts-ignore
    constructor(...args) {
        // @ts-ignore
        super(...args);
    }

    async fetch(request: SliceRequest) {
        return request;
    }
}
