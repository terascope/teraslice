import { Vector, VectorOptions, VectorType } from '../vector';

/**
 * @todo we need an to serialize to JSON correctly
*/
export class ObjectVector<
    T extends Record<string, any> = Record<string, any>
> extends Vector<T> {
    constructor(options: VectorOptions<T>) {
        super(VectorType.Object, options);
    }

    fork(data = this.data): ObjectVector<T> {
        return new ObjectVector({
            valueToJSON: this.valueToJSON,
            fieldType: this.fieldType,
            data,
            childConfig: this.childConfig,
        });
    }
}
