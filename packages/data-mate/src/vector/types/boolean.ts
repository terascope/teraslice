import { Vector, VectorOptions, VectorType } from '../vector';

export class BooleanVector extends Vector<boolean> {
    constructor(options: VectorOptions<boolean>) {
        super(VectorType.Boolean, options);
    }

    clone(data = this.data): BooleanVector {
        return new BooleanVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
