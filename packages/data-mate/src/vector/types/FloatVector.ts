import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class FloatVector extends Vector<number> {
    valueToJSON = undefined;

    constructor(options: VectorOptions<number>) {
        super(VectorType.Float, options);
    }

    fork(data: ReadableData<number>): FloatVector {
        return new FloatVector({
            config: this.config,
            data,
        });
    }
}
