import {
    Slicer, times, WorkerContext, ExecutionConfig
} from '@terascope/job-components';
import { SimpleReaderConfig } from './interfaces.js';
import SimpleClient from '../simple-connector/client.js';

export default class TestSlicer extends Slicer<SimpleReaderConfig> {
    client: SimpleClient;

    constructor(
        context: WorkerContext,
        opConfig: SimpleReaderConfig,
        executionConfig: ExecutionConfig
    ) {
        super(context, opConfig, executionConfig);

        this.client = this.context.apis.op_runner.getClient({}, 'simple-client');
    }

    async slice(): Promise<{ count: number }[]|null> {
        const { slicesToCreate, recordsToFetch } = this.opConfig;

        if (this.client.isFinished()) {
            return null;
        }

        return times(slicesToCreate, () => this.client.sliceRequest(recordsToFetch));
    }
}
