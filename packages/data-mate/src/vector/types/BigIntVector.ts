import { bigIntToJSON } from '@terascope/utils';
import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class BigIntVector extends Vector<bigint> {
    toJSONCompatibleValue = bigIntToJSON;
    getComparableValue = undefined;

    constructor(data: DataBuckets<bigint>, options: VectorOptions) {
        super(VectorType.BigInt, data, options);
    }
}
