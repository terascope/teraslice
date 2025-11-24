import { bigIntToJSON } from '@terascope/core-utils';
import { Vector, VectorOptions } from '../Vector.js';
import { VectorType, DataBuckets } from '../interfaces.js';

export class BigIntVector extends Vector<bigint> {
    toJSONCompatibleValue = bigIntToJSON;
    getComparableValue = undefined;

    constructor(data: DataBuckets<bigint>, options: VectorOptions) {
        super(VectorType.BigInt, data, options);
    }
}
