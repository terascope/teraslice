import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class BooleanVector extends Vector<boolean> {
    valueToJSON = undefined;

    constructor(data:ReadableData<boolean>, options: VectorOptions) {
        super(VectorType.Boolean, data, options);
    }
}
