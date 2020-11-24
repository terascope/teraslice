import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class StringVector extends Vector<string> {
    valueToJSON = undefined;

    constructor(data: ReadableData<string>, options: VectorOptions) {
        super(VectorType.String, data, options);
    }
}
