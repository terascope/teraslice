import { Vector, VectorOptions } from './Vector';
import { VectorType } from './interfaces';
import { ReadableData } from '../data';

export class ListVector<T = unknown> extends Vector<Vector<T>> {
    static valueToJSON(value: Vector<any>): any {
        return value.toJSON();
    }

    constructor(options: VectorOptions<Vector<T>>) {
        super(VectorType.List, {
            valueToJSON: ListVector.valueToJSON,
            ...options,
        });
        this.sortable = false;
    }

    fork(data: ReadableData<Vector<T>>): ListVector<T> {
        return new ListVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
            childConfig: this.childConfig,
        });
    }
}
