import { Maybe, Nil } from '@terascope/types';
import { castArray } from '@terascope/utils';
import { newVectorForType } from './utils';
import { Vector, VectorOptions } from './vector';

export class ListVector<T = unknown> extends Vector<Vector<T>> {
    static serialize(value: unknown, thisArg?: Vector<Vector<any>>): Maybe<Vector<any>> {
        if (value == null) return value as Nil;
        if (value instanceof Vector) return value;
        if (!thisArg) {
            throw new Error('Expected thisArg');
        }

        return newVectorForType(thisArg.type, castArray(value));
    }

    static deserialize(value: Maybe<Vector<any>>): any {
        if (value == null) return value as Nil;
        return value.toJSON();
    }

    constructor(options: VectorOptions<Vector<T>>) {
        super({
            serialize: ListVector.serialize,
            deserialize: ListVector.deserialize,
            ...options,
        });
    }
}
