import times from 'lodash/times';
import { Slicer } from '@terascope/job-components';
import { SimpleReaderConfig } from './interfaces';
import SimpleClient from '../simple-connector/client';

export default class TestSlicer extends Slicer<SimpleReaderConfig> {
    client: SimpleClient;

    // @ts-ignore
    constructor(...args) {
        // @ts-ignore
        super(...args);

        this.client = this.context.apis.op_runner.getClient({}, 'simple-client');
    }

    async slice() {
        const { slicesToCreate, recordsToFetch } = this.opConfig;

        if (this.client.isFinished()) {
            return null;
        }

        return times(slicesToCreate, () => {
            return this.client.sliceRequest(recordsToFetch);
        });
    }
}
