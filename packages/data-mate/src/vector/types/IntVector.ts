import { Vector, VectorOptions } from '../Vector';
import { OldData, VectorType } from '../interfaces';

export class IntVector extends Vector<number> {
    constructor(options: VectorOptions<number>) {
        super(VectorType.Int, options);
    }

    fork(data: OldData<number>): IntVector {
        return new IntVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
