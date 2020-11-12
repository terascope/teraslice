import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { IPValue, ReadableData } from '../../core';

export class IPVector extends Vector<IPValue> {
    constructor(options: VectorOptions<IPValue>) {
        super(VectorType.IP, options);
    }

    fork(data: ReadableData<IPValue>): IPVector {
        return new IPVector({
            config: this.config,
            data,
        });
    }

    valueToJSON(value: IPValue): string {
        return value.ip;
    }
}
