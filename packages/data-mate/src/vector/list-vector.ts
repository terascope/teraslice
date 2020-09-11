import { Maybe, Nil } from '@terascope/types';
import { castArray } from '@terascope/utils';
import { newVectorForType } from './utils';
import { Vector, VectorOptions, VectorType } from './vector';

export class ListVector<T = unknown> extends Vector<Vector<T>> {
    static valueFrom(value: unknown, thisArg?: Vector<Vector<any>>): Maybe<Vector<any>> {
        if (value == null) return value as Nil;
        if (value instanceof Vector) return value;
        if (!thisArg) {
            throw new Error('Expected thisArg');
        }

        return newVectorForType(thisArg.fieldType, castArray(value));
    }

    static valueToJSON(value: Maybe<Vector<any>>): any {
        if (value == null) return value as Nil;
        return value.toJSON();
    }

    constructor(options: VectorOptions<Vector<T>>) {
        super(VectorType.List, {
            valueFrom: ListVector.valueFrom,
            valueToJSON: ListVector.valueToJSON,
            ...options,
        });
    }

    clone(options: VectorOptions<Vector<T>>): ListVector<T> {
        return new ListVector(options);
    }
}
