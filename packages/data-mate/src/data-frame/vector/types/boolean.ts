import { Maybe, Nil } from '@terascope/types';
import { toBoolean } from '@terascope/utils';
import { Vector, VectorOptions } from '../vector';

export class BooleanVector extends Vector<boolean> {
    static valueFromJSON(value: unknown): Maybe<boolean> {
        if (value == null) return value as Nil;
        return toBoolean(value);
    }

    constructor(options: VectorOptions<boolean>) {
        super({
            valueFromJSON: BooleanVector.valueFromJSON,
            ...options,
        });
    }
}
