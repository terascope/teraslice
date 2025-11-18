import { Fetcher, SliceRequest } from '@terascope/job-components';
import { DataEntity } from '@terascope/core-utils';

export default class TestFetcher extends Fetcher<Record<string, any>> {
    async fetch(request: SliceRequest): Promise<DataEntity[]> {
        return request as DataEntity[];
    }
}
