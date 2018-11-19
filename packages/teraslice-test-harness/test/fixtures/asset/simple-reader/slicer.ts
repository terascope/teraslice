import times from 'lodash/times';
import { Slicer } from '@terascope/job-components';
import { SimpleReaderConfig } from './interfaces';
import SimpleClient from '../../../examples/helpers/simple-client';

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

        return times(slicesToCreate, () => {
            return this.client.sliceRequest(recordsToFetch);
        });
    }
}
