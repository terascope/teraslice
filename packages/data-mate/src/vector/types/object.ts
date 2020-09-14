import { DataTypeFields } from '@terascope/types';
import { Vector, VectorOptions, VectorType } from '../vector';

/**
 * @todo we need an to serialize to JSON correctly
*/
export class ObjectVector<
    T extends Record<string, any> = Record<string, any>
> extends Vector<T> {
    childConfig: DataTypeFields;

    constructor(options: VectorOptions<T> & { childConfig?: DataTypeFields }) {
        super(VectorType.Object, options);
        this.childConfig = options.childConfig ?? {};
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
