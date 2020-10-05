import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { ReadableData } from '../../data';

/**
 * @todo we need an to serialize to JSON correctly
*/
export class ObjectVector<
    T extends Record<string, any> = Record<string, any>
> extends Vector<T> {
    constructor(options: VectorOptions<T>) {
        super(VectorType.Object, options);
        this.sortable = false;
    }

    fork(data: ReadableData<T>): ObjectVector<T> {
        return new ObjectVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
            childConfig: this.childConfig,
        });
    }
}
