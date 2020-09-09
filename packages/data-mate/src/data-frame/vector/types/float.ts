import { FieldType, Maybe, Nil } from '@terascope/types';
import { Vector } from '../vector';

export class FloatVector extends Vector<number> {
    constructor(type: FieldType, values: Maybe<number>[]) {
        super(type, values, coerce);
    }
}

function coerce(value: unknown): Maybe<number> {
    if (value == null) return value as Nil;
    if (typeof value === 'number') {
        return value;
    }
    return parseFloat(value as any);
}
