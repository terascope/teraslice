import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class BooleanVector extends Vector<boolean> {
    toJSONCompatibleValue = undefined;
    getComparableValue = undefined;

    constructor(data:DataBuckets<boolean>, options: VectorOptions) {
        super(VectorType.Boolean, data, options);
    }
}
