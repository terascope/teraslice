import { TestReaderConfig } from './interfaces';
import { Slicer } from '../../operations';

export default class TestSlicer<T = TestReaderConfig> extends Slicer<T> {
    async slice() {
        return {};
    }
}
