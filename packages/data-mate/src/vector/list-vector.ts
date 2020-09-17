import { Vector, VectorOptions, VectorType } from './vector';

export class ListVector<T = unknown> extends Vector<Vector<T>> {
    static valueToJSON(value: Vector<any>): any {
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
            data,
            childConfig: this.childConfig,
        });
    }
}
