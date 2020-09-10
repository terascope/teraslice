import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions, VectorType } from '../vector';

export class IntVector extends Vector<number> {
    static valueFrom(value: unknown): Maybe<number> {
        if (value == null) return value as Nil;
        return parseInt(value as any, 10);
    }

    constructor(options: VectorOptions<number>) {
        super(VectorType.Int, {
            valueFrom: IntVector.valueFrom,
            ...options,
        });
    }

    clone(options: VectorOptions<number>): IntVector {
        return new IntVector(options);
    }
}
