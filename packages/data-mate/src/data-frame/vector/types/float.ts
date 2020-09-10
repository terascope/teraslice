import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions, VectorType } from '../vector';

export class FloatVector extends Vector<number> {
    static valueFrom(value: unknown): Maybe<number> {
        if (value == null) return value as Nil;
        return parseFloat(value as any);
    }

    constructor(options: VectorOptions<number>) {
        super(VectorType.Float, {
            valueFrom: FloatVector.valueFrom,
            ...options,
        });
    }
}
