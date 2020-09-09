import { FieldType, Maybe, Nil } from '@terascope/types';
import { toString } from '@terascope/utils';
import { Vector } from './base';

export class StringVector extends Vector<string> {
    constructor(type: FieldType, values: Maybe<string>[]) {
        super(type, values, coerce);
    }
}

function coerce(value: unknown): Maybe<string> {
    if (value == null) return value as Nil;
    return toString(value);
}
