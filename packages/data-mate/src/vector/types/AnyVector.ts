import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class AnyVector extends Vector<any> {
    valueToJSON = undefined;

    constructor(data: ReadableData<any>, options: VectorOptions) {
        super(VectorType.Any, data, options);
    }
}
