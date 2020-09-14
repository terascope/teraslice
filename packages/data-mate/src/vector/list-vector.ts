import { Maybe, Nil } from '@terascope/types';
import { Vector, VectorOptions, VectorType } from './vector';

export class ListVector<T = unknown> extends Vector<Vector<T>> {
    static valueToJSON(value: Maybe<Vector<any>>): any {
        if (value == null) return value as Nil;
        return value.toJSON();
    }

    constructor(options: VectorOptions<Vector<T>>) {
        super(VectorType.List, {
            valueToJSON: ListVector.valueToJSON,
            ...options,
        });
    }

    fork(data = this.data): ListVector<T> {
        return new ListVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data
        });
    }
}
