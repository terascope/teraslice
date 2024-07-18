import { Vector, VectorOptions } from '../Vector.js';
import { VectorType, DataBuckets } from '../interfaces.js';

export class IPRangeVector extends Vector<string> {
    toJSONCompatibleValue = undefined;
    getComparableValue = undefined;

    constructor(data: DataBuckets<string>, options: VectorOptions) {
        super(VectorType.IPRange, data, options);
    }
}
