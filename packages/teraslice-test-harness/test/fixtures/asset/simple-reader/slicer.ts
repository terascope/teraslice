import times from 'lodash/times';
import { Slicer } from '@terascope/job-components';
import { SimpleReaderConfig } from './interfaces';

export default class TestSlicer extends Slicer<SimpleReaderConfig> {
    async slice() {
        const { slicesToCreate, recordsToFetch } = this.opConfig;

        return times(slicesToCreate, () => ({
            count: recordsToFetch,
        }));
    }
}
