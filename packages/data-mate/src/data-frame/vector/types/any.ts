import { Vector, VectorOptions, VectorType } from '../vector';

export class AnyVector extends Vector<any> {
    constructor(options: VectorOptions<any>) {
        super(VectorType.Any, options);
    }

    clone(options: VectorOptions<any>): AnyVector {
        return new AnyVector(options);
    }
}
