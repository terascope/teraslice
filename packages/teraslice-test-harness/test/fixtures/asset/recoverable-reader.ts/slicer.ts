import { Slicer, AnyObject, SlicerRecoveryData } from '@terascope/job-components';

export default class Counter extends Slicer<AnyObject> {
    count = 0;

    async initialize(recoveryData: SlicerRecoveryData[]) {
        super.initialize(recoveryData);
        if (this.recoveryData.length > 0) {
            const { lastSlice } = this.recoveryData[0];
            if (lastSlice) {
                this.count = lastSlice.count;
            }
        }
    }

    isRecoverable() {
        return true;
    }

    async slice() {
        this.count += 1;
        return { count: this.count };
    }
}
