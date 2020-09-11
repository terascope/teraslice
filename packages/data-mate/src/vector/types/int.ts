import { Vector, VectorOptions, VectorType } from '../vector';

export class IntVector extends Vector<number> {
    constructor(options: VectorOptions<number>) {
        super(VectorType.Int, options);
    }

    clone(data = this.data): IntVector {
        return new IntVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
