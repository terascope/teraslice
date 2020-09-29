import { Vector, VectorOptions } from '../Vector';
import { Data, VectorType } from '../interfaces';

export class IntVector extends Vector<number> {
    constructor(options: VectorOptions<number>) {
        super(VectorType.Int, options);
    }

    fork(data: Data<number>): IntVector {
        return new IntVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
