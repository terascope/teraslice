import { Maybe, Nil } from '@terascope/types';
import { toBoolean } from '@terascope/utils';
import { Vector, VectorOptions, VectorType } from '../vector';

export class BooleanVector extends Vector<boolean> {
    static valueFrom(value: unknown): Maybe<boolean> {
        if (value == null) return value as Nil;
        return toBoolean(value);
    }

    constructor(options: VectorOptions<boolean>) {
        super(VectorType.Boolean, {
            valueFrom: BooleanVector.valueFrom,
            ...options,
        });
    }

    clone(options: VectorOptions<boolean>): BooleanVector {
        return new BooleanVector(options);
    }
}
