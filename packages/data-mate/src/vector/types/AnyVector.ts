import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../core';

export class AnyVector extends Vector<any> {
    constructor(options: VectorOptions<any>) {
        super(VectorType.Any, options);
    }

    fork(data: ReadableData<any>): AnyVector {
        return new AnyVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
