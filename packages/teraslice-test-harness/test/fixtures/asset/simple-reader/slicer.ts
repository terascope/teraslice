import { Slicer, SlicerRecoveryData } from '@terascope/job-components';
import { times } from '@terascope/core-utils';
import { SimpleReaderConfig } from './interfaces';
import SimpleClient from '../simple-connector/client';

export default class TestSlicer extends Slicer<SimpleReaderConfig> {
    client!: SimpleClient;

    async initialize(recoveryData: SlicerRecoveryData[]): Promise<void> {
        await super.initialize(recoveryData);
        this.client = await this.context.apis.op_runner.getClient({}, 'simple-client');
    }

    async slice(): Promise<{ count: number }[] | null> {
        const { slicesToCreate, recordsToFetch } = this.opConfig;

        if (this.client.isFinished()) {
            return null;
        }

        return times(slicesToCreate, () => this.client.sliceRequest(recordsToFetch));
    }
}
