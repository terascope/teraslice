import { v4 as uuidv4 } from 'uuid';
import { Slicer } from '../../../../src/index.js';

export default class FlakyReaderSlicer extends Slicer {
    async slice(): Promise<{ id: string }> {
        return { id: uuidv4() };
    }
}
