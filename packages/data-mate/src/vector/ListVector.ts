import { Vector, VectorOptions } from './Vector';
import { OldData, VectorType } from './interfaces';

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

    fork(data: OldData<Vector<T>>): ListVector<T> {
        return new ListVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
            childConfig: this.childConfig,
        });
    }
}
