import { Vector, VectorOptions } from '../Vector.js';
import { VectorType, DataBuckets } from '../interfaces.js';

export class IntVector extends Vector<number> {
    toJSONCompatibleValue = undefined;
    getComparableValue = undefined;

    constructor(data: DataBuckets<number>, options: VectorOptions) {
        super(VectorType.Int, data, options);
    }
}
