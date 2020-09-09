import { Maybe, Nil } from '@terascope/types';
import { toString } from '@terascope/utils';
import { Vector, VectorOptions } from '../vector';

export class StringVector extends Vector<string> {
    static serialize(value: unknown): Maybe<string> {
        if (value == null) return value as Nil;
        return toString(value);
    }

    constructor(options: VectorOptions<string>) {
        super({
            serialize: StringVector.serialize,
            ...options,
        });
    }
}
