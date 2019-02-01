import uuidv4 from 'uuid/v4';
import { Slicer } from '../../../src';

export default class ExampleSlicer extends Slicer {
    _initialized = false;
    _shutdown = false;

    async initialize(recoveryData: object[]) {
        this._initialized = true;
        return super.initialize(recoveryData);
    }

    async shutdown() {
        this._shutdown = true;
        return super.shutdown();
    }

    async slice() {
        return {
            id: uuidv4(),
            fetchFrom: 'https://httpstat.us/200'
        };
    }
}
