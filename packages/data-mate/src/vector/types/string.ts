import { Vector, VectorOptions } from '../vector';
import { VectorType } from '../interfaces';

export class StringVector extends Vector<string> {
    constructor(options: VectorOptions<string>) {
        super(VectorType.String, options);
    }

    fork(data = this.data): StringVector {
        return new StringVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
        });
    }
}
