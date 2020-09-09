import { FieldType, Maybe, Nil } from '@terascope/types';
import { Vector } from '../vector';

export class BigIntVector extends Vector<bigint> {
    constructor(type: FieldType, values: Maybe<bigint>[]) {
        super(type, values, coerce);
    }
}

function coerce(value: unknown): Maybe<bigint> {
    if (value == null) return value as Nil;
    if (typeof value !== 'bigint') return BigInt(value);
    return value;
}
