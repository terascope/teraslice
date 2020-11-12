import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class IPRangeVector extends Vector<string> {
    valueToJSON = undefined;

    constructor(data: ReadableData<string>, options: VectorOptions) {
        super(VectorType.IPRange, data, options);
    }
}
