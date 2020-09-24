import { Vector, VectorOptions } from '../vector';
import { VectorType } from '../interfaces';

export class AnyVector extends Vector<any> {
    constructor(options: VectorOptions<any>) {
        super(VectorType.Any, options);
    }

    fork(data = this.data): AnyVector {
        return new AnyVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
