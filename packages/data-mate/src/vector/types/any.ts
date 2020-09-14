import { Vector, VectorOptions, VectorType } from '../vector';

export class AnyVector extends Vector<any> {
    constructor(options: VectorOptions<any>) {
        super(VectorType.Any, options);
    }

    fork(data = this.data): AnyVector {
        return new AnyVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
