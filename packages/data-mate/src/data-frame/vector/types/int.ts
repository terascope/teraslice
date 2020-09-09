import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions } from '../vector';

export class IntVector extends Vector<number> {
    static serialize(value: unknown): Maybe<number> {
        if (value == null) return value as Nil;
        if (typeof value === 'number') {
            return value;
        }
        return parseInt(value as any, 10);
    }

    constructor(options: VectorOptions<number>) {
        super({
            serialize: IntVector.serialize,
            ...options,
        });
    }
}
