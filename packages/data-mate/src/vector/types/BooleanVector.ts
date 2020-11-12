import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class BooleanVector extends Vector<boolean> {
    valueToJSON = undefined;

    constructor(options: VectorOptions<boolean>) {
        super(VectorType.Boolean, options);
    }

    fork(data: ReadableData<boolean>): BooleanVector {
        return new BooleanVector({
            config: this.config,
            data,
        });
    }
}
