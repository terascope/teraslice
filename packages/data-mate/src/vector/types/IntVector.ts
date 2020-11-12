import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class IntVector extends Vector<number> {
    valueToJSON = undefined;

    constructor(options: VectorOptions<number>) {
        super(VectorType.Int, options);
    }

    fork(data: ReadableData<number>): IntVector {
        return new IntVector({
            config: this.config,
            data,
        });
    }
}
