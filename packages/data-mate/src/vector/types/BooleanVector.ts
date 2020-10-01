import { Vector, VectorOptions } from '../Vector';
import { OldData, VectorType } from '../interfaces';

export class BooleanVector extends Vector<boolean> {
    constructor(options: VectorOptions<boolean>) {
        super(VectorType.Boolean, options);
    }

    fork(data: OldData<boolean>): BooleanVector {
        return new BooleanVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
