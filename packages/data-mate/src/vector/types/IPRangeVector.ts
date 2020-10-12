import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class IPRangeVector extends Vector<string> {
    constructor(options: VectorOptions<string>) {
        super(VectorType.IPRange, options);
    }

    fork(data: ReadableData<string>): IPRangeVector {
        return new IPRangeVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
