import { SimpleReaderConfig } from './interfaces';
import times from 'lodash/times';
import { Fetcher, SliceRequest } from '@terascope/job-components';
import SimpleClient from '../simple-connector/client';
import { SimpleAPI } from '../simple-api/interfaces';

export default class TestFetcher extends Fetcher<SimpleReaderConfig> {
    client: SimpleClient;

    // @ts-ignore
    constructor(...args) {
        // @ts-ignore
        super(...args);

        this.client = this.context.apis.op_runner.getClient({}, 'simple-client');
    }

    async fetch(request: SliceRequest) {
        const api = this.getAPI('simple-api') as SimpleAPI;
        return times(request.count, (id) => {
            api.add(2);
            return this.client.fetchRecord(id);
        });
    }
}
