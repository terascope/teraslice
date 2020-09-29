import { Vector, VectorOptions } from '../Vector';
import { Data, VectorType } from '../interfaces';

export class FloatVector extends Vector<number> {
    constructor(options: VectorOptions<number>) {
        super(VectorType.Float, options);
    }

    fork(data: Data<number>): FloatVector {
        return new FloatVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
