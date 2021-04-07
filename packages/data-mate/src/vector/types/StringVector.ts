import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class StringVector extends Vector<string> {
    getComparableValue = undefined;

    valueToJSON = undefined;

    constructor(data: DataBuckets<string>, options: VectorOptions) {
        super(VectorType.String, data, options);
    }
}
