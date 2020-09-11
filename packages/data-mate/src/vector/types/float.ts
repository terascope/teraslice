import { Vector, VectorOptions, VectorType } from '../vector';

export class FloatVector extends Vector<number> {
    constructor(options: VectorOptions<number>) {
        super(VectorType.Float, options);
    }

    clone(data = this.data): FloatVector {
        return new FloatVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
