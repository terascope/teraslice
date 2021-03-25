import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';
import { IPValue } from '../../core';

export class IPVector extends Vector<IPValue> {
    constructor(data: DataBuckets<IPValue>, options: VectorOptions) {
        super(VectorType.IP, data, options);
    }

    valueToJSON(value: IPValue): string {
        return value.ip;
    }
}
