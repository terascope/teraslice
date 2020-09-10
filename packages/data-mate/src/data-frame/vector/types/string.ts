import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions, VectorType } from '../vector';

export class StringVector extends Vector<string> {
    static valueFrom(value: unknown): Maybe<string> {
        if (value == null) return value as Nil;
        return String(value);
    }

    constructor(options: VectorOptions<string>) {
        super(VectorType.String, {
            valueFrom: StringVector.valueFrom,
            ...options,
        });
    }
}
