import { TestReaderConfig } from './interfaces';
import { Slicer } from '../../operations';

export default class TestSlicer extends Slicer<TestReaderConfig> {
    async slice() {
        return {};
    }
}
