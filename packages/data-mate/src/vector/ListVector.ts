import { Vector, VectorOptions } from './Vector';
import { VectorType } from './interfaces';
import { Data } from '../core-utils';

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

    fork(data: Data<Vector<T>>): ListVector<T> {
        return new ListVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
            childConfig: this.childConfig,
        });
    }
}
