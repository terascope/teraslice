import { Fetcher, SliceRequest } from '@terascope/job-components';
import { DataEntity, times } from '@terascope/core-utils';
import { SimpleReaderConfig } from './interfaces';
import SimpleClient from '../simple-connector/client';
import { SimpleAPI } from '../simple-api/interfaces';

export default class TestFetcher extends Fetcher<SimpleReaderConfig> {
    client!: SimpleClient;

    async initialize(): Promise<void> {
        await super.initialize();
        this.client = await this.context.apis.op_runner.getClient({}, 'simple-client');
    }

    async fetch(request: SliceRequest): Promise<DataEntity[]> {
        const api = this.getAPI('simple-api') as SimpleAPI;
        return times(request.count, (id) => {
            api.add(2);
            return DataEntity.make(this.client.fetchRecord(id));
        });
    }
}
