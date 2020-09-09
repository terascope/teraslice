import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions } from '../vector';

export class FloatVector extends Vector<number> {
    static valueFromJSON(value: unknown): Maybe<number> {
        if (value == null) return value as Nil;
        return parseFloat(value as any);
    }

    constructor(options: VectorOptions<number>) {
        super({
            valueFromJSON: FloatVector.valueFromJSON,
            ...options,
        });
    }
}
