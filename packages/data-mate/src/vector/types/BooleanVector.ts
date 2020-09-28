import { Vector, VectorOptions } from '../Vector';
import { Data, VectorType } from '../interfaces';

export class BooleanVector extends Vector<boolean> {
    constructor(options: VectorOptions<boolean>) {
        super(VectorType.Boolean, options);
    }

    fork(data: Data<boolean>): BooleanVector {
        return new BooleanVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
