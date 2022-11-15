import {
    Fetcher, SliceRequest, times, WorkerContext, ExecutionConfig, DataEntity
} from '@terascope/job-components';
import { SimpleReaderConfig } from './interfaces.js';
import SimpleClient from '../simple-connector/client.js';
import { SimpleAPI } from '../simple-api/interfaces.js';

export default class TestFetcher extends Fetcher<SimpleReaderConfig> {
    client: SimpleClient;

    constructor(
        context: WorkerContext,
        opConfig: SimpleReaderConfig,
        executionConfig: ExecutionConfig
    ) {
        super(context, opConfig, executionConfig);

        this.client = this.context.apis.op_runner.getClient({}, 'simple-client');
    }

    async fetch(request: SliceRequest): Promise<DataEntity[]> {
        const api = this.getAPI('simple-api') as SimpleAPI;
        return times(request.count, (id) => {
            api.add(2);
            return DataEntity.make(this.client.fetchRecord(id));
        });
    }
}
