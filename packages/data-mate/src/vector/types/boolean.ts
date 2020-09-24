import { Vector, VectorOptions } from '../vector';
import { VectorType } from '../interfaces';

export class BooleanVector extends Vector<boolean> {
    constructor(options: VectorOptions<boolean>) {
        super(VectorType.Boolean, options);
    }

    fork(data = this.data): BooleanVector {
        return new BooleanVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
