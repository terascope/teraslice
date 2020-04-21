import { v4 as uuidv4 } from 'uuid';
import { Slicer } from '../../../src';

export default class FailingSlicer extends Slicer {
    async slice() {
        return {
            id: uuidv4(),
        };
    }
}
