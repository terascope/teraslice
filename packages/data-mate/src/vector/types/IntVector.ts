import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class IntVector extends Vector<number> {
    constructor(options: VectorOptions<number>) {
        super(VectorType.Int, options);
    }

    fork(data: ReadableData<number>): IntVector {
        return new IntVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
