import { Vector, VectorOptions } from '../Vector';
import { Data, VectorType } from '../interfaces';

export class AnyVector extends Vector<any> {
    constructor(options: VectorOptions<any>) {
        super(VectorType.Any, options);
    }

    fork(data: Data<any>): AnyVector {
        return new AnyVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
