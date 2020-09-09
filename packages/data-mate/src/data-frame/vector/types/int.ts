import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions } from '../vector';

export class IntVector extends Vector<number> {
    static valueFromJSON(value: unknown): Maybe<number> {
        if (value == null) return value as Nil;
        return parseInt(value as any, 10);
    }

    constructor(options: VectorOptions<number>) {
        super({
            valueFromJSON: IntVector.valueFromJSON,
            ...options,
        });
    }
}
