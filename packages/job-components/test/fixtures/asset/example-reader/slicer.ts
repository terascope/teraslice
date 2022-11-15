import { v4 as uuidv4 } from 'uuid';
import { Slicer, SlicerRecoveryData } from '../../../../src/index.js';

export default class ExampleSlicer extends Slicer {
    _initialized = false;
    _shutdown = false;

    async initialize(recoveryData: SlicerRecoveryData[]): Promise<void> {
        this._initialized = true;
        return super.initialize(recoveryData);
    }

    async shutdown(): Promise<void> {
        this._shutdown = true;
        return super.shutdown();
    }

    async slice(): Promise<{ id: string; fetchFrom: string }> {
        return {
            id: uuidv4(),
            fetchFrom: 'https://httpstat.us/200',
        };
    }
}
