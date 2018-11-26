import { SimpleReaderConfig } from './interfaces';
import times from 'lodash/times';
import { Fetcher, SliceRequest } from '@terascope/job-components';
import SimpleClient from '../simple-connector/client';

export default class TestFetcher extends Fetcher<SimpleReaderConfig> {
    client: SimpleClient;

    // @ts-ignore
    constructor(...args) {
        // @ts-ignore
        super(...args);

        this.client = this.context.apis.op_runner.getClient({}, 'simple-client');
    }

    async fetch(request: SliceRequest) {
        return times(request.count, (id) => {
            return this.client.fetchRecord(id);
        });
    }
}
