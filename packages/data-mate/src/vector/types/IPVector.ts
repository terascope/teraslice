import { parse } from 'ip-bigint';
import { Vector, VectorOptions } from '../Vector.js';
import { VectorType, DataBuckets } from '../interfaces.js';

export class IPVector extends Vector<string> {
    toJSONCompatibleValue = undefined;

    constructor(data: DataBuckets<string>, options: VectorOptions) {
        super(VectorType.IP, data, options);
    }

    getComparableValue(value: string): any {
        return parse(value).number;
    }
}
