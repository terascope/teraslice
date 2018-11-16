import { Slicer } from '@terascope/job-components';
import { SimpleReaderConfig } from './interfaces';

export default class TestSlicer<T = SimpleReaderConfig> extends Slicer<T> {
    async slice() {
        return {
            getRecords: 1,
        };
    }
}
