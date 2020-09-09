import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions } from '../vector';

export class FloatVector extends Vector<number> {
    static serialize(value: unknown): Maybe<number> {
        if (value == null) return value as Nil;
        if (typeof value === 'number') {
            return value;
        }
        return parseFloat(value as any);
    }

    constructor(options: VectorOptions<number>) {
        super({
            serialize: FloatVector.serialize,
            ...options,
        });
    }
}
