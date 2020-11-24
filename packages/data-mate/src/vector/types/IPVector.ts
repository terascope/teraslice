import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { IPValue, ReadableData } from '../../core';

export class IPVector extends Vector<IPValue> {
    constructor(data: ReadableData<IPValue>, options: VectorOptions) {
        super(VectorType.IP, data, options);
    }

    valueToJSON(value: IPValue): string {
        return value.ip;
    }
}
