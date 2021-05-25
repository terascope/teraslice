import { FieldType } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { SerializeOptions, VectorType, DataBuckets } from '../interfaces';
import { getChildDataTypeConfig } from '../../core';

type ChildFields = readonly Vector<any>[];

export class TupleVector<
    T extends [...any] = [...any]
> extends Vector<T> {
    getComparableValue = undefined;

    #childFields?: ChildFields;

    constructor(data: DataBuckets<T>, options: VectorOptions) {
        super(VectorType.Tuple, data, options);
        this.sortable = false;
    }

    get childFields(): ChildFields {
        if (this.#childFields) return this.#childFields;

        if (!this.childConfig) {
            this.#childFields = [];
            return this.#childFields;
        }
        const childFields: ChildFields = Object.entries(this.childConfig)
            .map(([field, config], index) => Vector.make<any>([], {
                childConfig: getChildDataTypeConfig(
                    this.childConfig!, field, config.type as FieldType
                ),
                config,
                name: this._getChildName(index)
            }));

        this.#childFields = childFields;
        return childFields;
    }

    toJSONCompatibleValue(values: T, options?: SerializeOptions): any {
        const nilValue: any = options?.useNullForUndefined ? null : undefined;

        let nonNilValues = 0;
        const result = this.childFields.map((vector, index) => {
            const value = values[index];
            if (value == null || !vector.toJSONCompatibleValue) return value ?? nilValue;
            nonNilValues++;
            return vector.toJSONCompatibleValue(value, options);
        });

        if (options?.skipEmptyArrays && !nonNilValues) {
            return nilValue;
        }
        return result;
    }

    private _getChildName(index: number): string|undefined {
        if (!this.name) return undefined;
        return `${this.name}.${index}`;
    }
}
