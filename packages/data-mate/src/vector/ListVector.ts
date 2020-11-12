import { Vector, VectorOptions } from './Vector';
import { VectorType } from './interfaces';
import { ReadableData } from '../core';

export class ListVector<T = unknown> extends Vector<Vector<T>> {
    static valueToJSON(value: Vector<any>): any {
        return value.toJSON();
    }

    constructor(options: VectorOptions<Vector<T>>) {
        super(VectorType.List, options);
        this.sortable = false;
    }

    valueToJSON(value: Vector<T>): any {
        return value.toJSON();
    }

    fork(data: ReadableData<Vector<T>>): ListVector<T> {
        return new ListVector({
            config: this.config,
            data,
            childConfig: this.childConfig,
        });
    }
}
