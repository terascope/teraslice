import { Vector, VectorOptions } from '../Vector.js';
import { VectorType, DataBuckets } from '../interfaces.js';

export class BooleanVector extends Vector<boolean> {
    toJSONCompatibleValue = undefined;
    getComparableValue = undefined;

    constructor(data: DataBuckets<boolean>, options: VectorOptions) {
        super(VectorType.Boolean, data, options);
    }
}
