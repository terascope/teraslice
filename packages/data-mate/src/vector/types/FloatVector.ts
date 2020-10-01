import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { Data } from '../../core-utils';

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
