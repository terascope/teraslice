import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class IPRangeVector extends Vector<string> {
    valueToJSON = undefined;

    constructor(options: VectorOptions<string>) {
        super(VectorType.IPRange, options);
    }

    fork(data: ReadableData<string>): IPRangeVector {
        return new IPRangeVector({
            config: this.config,
            data,
        });
    }
}
