import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class AnyVector extends Vector<any> {
    valueToJSON = undefined;

    constructor(options: VectorOptions<any>) {
        super(VectorType.Any, options);
    }

    fork(data: ReadableData<any>): AnyVector {
        return new AnyVector({
            config: this.config,
            data,
        });
    }
}
