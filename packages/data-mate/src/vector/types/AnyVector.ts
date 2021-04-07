import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class AnyVector extends Vector<any> {
    valueToJSON = undefined;
    getComparableValue = undefined;

    constructor(data: DataBuckets<any>, options: VectorOptions) {
        super(VectorType.Any, data, options);
    }
}
