import { Vector, VectorOptions } from '../vector';
import { VectorType } from '../interfaces';

export class FloatVector extends Vector<number> {
    constructor(options: VectorOptions<number>) {
        super(VectorType.Float, options);
    }

    fork(data = this.data): FloatVector {
        return new FloatVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
