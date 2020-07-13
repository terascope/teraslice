import {
    Fetcher, SliceRequest, AnyObject, DataEntity
} from '@terascope/job-components';

export default class TestFetcher extends Fetcher<AnyObject> {
    async fetch(request: SliceRequest): Promise<DataEntity[]> {
        return request as DataEntity[];
    }
}
