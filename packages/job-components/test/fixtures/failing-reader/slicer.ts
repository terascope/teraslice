import uuidv4 from 'uuid/v4';
import { Slicer } from '../../..';

export default class FailingSlicer extends Slicer {
    async slice() {
        return {
            id: uuidv4(),
        };
    }
}
