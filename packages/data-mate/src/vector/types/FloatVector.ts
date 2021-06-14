import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class FloatVector extends Vector<number> {
    toJSONCompatibleValue = undefined;
    getComparableValue = undefined;

    constructor(data: DataBuckets<number>, options: VectorOptions) {
        super(VectorType.Float, data, options);
    }
}
