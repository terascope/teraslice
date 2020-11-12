import { Vector, VectorOptions } from './Vector';
import { VectorType } from './interfaces';
import { ReadableData } from '../core';

export class ListVector<T = unknown> extends Vector<Vector<T>> {
    constructor(data: ReadableData<Vector<T>>, options: VectorOptions) {
        super(VectorType.List, data, options);
        this.sortable = false;
    }

    valueToJSON(value: Vector<T>): any {
        return value.toJSON();
    }
}
