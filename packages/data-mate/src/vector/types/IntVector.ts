import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class IntVector extends Vector<number> {
    valueToJSON = undefined;

    constructor(data: DataBuckets<number>, options: VectorOptions) {
        super(VectorType.Int, data, options);
    }
}
