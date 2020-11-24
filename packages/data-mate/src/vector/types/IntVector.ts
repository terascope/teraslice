import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class IntVector extends Vector<number> {
    valueToJSON = undefined;

    constructor(data: ReadableData<number>, options: VectorOptions) {
        super(VectorType.Int, data, options);
    }
}
