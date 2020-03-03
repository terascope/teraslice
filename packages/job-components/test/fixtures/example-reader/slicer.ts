import { v4 as uuidv4 } from 'uuid';
import { Slicer, SlicerRecoveryData } from '../../../src';

export default class ExampleSlicer extends Slicer {
    _initialized = false;
    _shutdown = false;

    async initialize(recoveryData: SlicerRecoveryData[]) {
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
            fetchFrom: 'https://httpstat.us/200',
        };
    }
}
