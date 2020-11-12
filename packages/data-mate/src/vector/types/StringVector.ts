import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class StringVector extends Vector<string> {
    valueToJSON = undefined;

    constructor(options: VectorOptions<string>) {
        super(VectorType.String, options);
    }

    fork(data: ReadableData<string>): StringVector {
        return new StringVector({
            config: this.config,
            data,
        });
    }
}
