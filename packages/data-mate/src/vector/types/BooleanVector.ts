import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../data';

export class BooleanVector extends Vector<boolean> {
    constructor(options: VectorOptions<boolean>) {
        super(VectorType.Boolean, options);
    }

    fork(data: ReadableData<boolean>): BooleanVector {
        return new BooleanVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
