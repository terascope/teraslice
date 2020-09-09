import { FieldType, Maybe } from '@terascope/types';
import { castArray } from '@terascope/utils';
import { Vector } from '../vector';
import { CoerceFn } from '../interfaces';

type Value<T> = Maybe<(Maybe<T>[])|Vector<T>>;
export class ListVector<T = unknown> extends Vector<Vector<T>> {
    constructor(type: FieldType, values: Value<T>[], coerce: CoerceFn<T>) {
        super(type, values as any[], makeCoerceFn(coerce));
    }
}

function makeCoerceFn<T>(childCoerce: CoerceFn<T>) {
    return (function coerceToArray(value: Value<T>) {
        if (value == null) return value;
        if (value instanceof Vector) return value;
        return childCoerce(castArray(value));
    }) as CoerceFn<Vector<T>>;
}
