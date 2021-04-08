import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class IPRangeVector extends Vector<string> {
    valueToJSON = undefined;
    getComparableValue = undefined;

    constructor(data: DataBuckets<string>, options: VectorOptions) {
        super(VectorType.IPRange, data, options);
    }
}
