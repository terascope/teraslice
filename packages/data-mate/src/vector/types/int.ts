import { Vector, VectorOptions } from '../vector';
import { VectorType } from '../interfaces';

export class IntVector extends Vector<number> {
    constructor(options: VectorOptions<number>) {
        super(VectorType.Int, options);
    }

    fork(data = this.data): IntVector {
        return new IntVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
