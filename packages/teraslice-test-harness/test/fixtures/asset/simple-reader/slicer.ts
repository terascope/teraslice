import { Slicer, times } from '@terascope/job-components';
import { SimpleReaderConfig } from './interfaces';
import SimpleClient from '../simple-connector/client';

export default class TestSlicer extends Slicer<SimpleReaderConfig> {
    client: SimpleClient;

    // @ts-expect-error
    constructor(...args) {
        // @ts-expect-error
        super(...args);

        this.client = this.context.apis.op_runner.getClient({}, 'simple-client');
    }

    async slice() {
        const { slicesToCreate, recordsToFetch } = this.opConfig;

        if (this.client.isFinished()) {
            return null;
        }

        return times(slicesToCreate, () => this.client.sliceRequest(recordsToFetch));
    }
}
