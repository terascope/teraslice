import { FieldType } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { getObjectDataTypeConfig, ReadableData } from '../../core';

type ChildFields = readonly Vector<any>[];

export class TupleVector<
    T extends [...any] = [...any]
> extends Vector<T> {
    #childFields?: ChildFields;

    constructor(data: ReadableData<T>, options: VectorOptions) {
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
            .map(([field, config], index) => {
                const childConfig = (config.type === FieldType.Object
                    ? getObjectDataTypeConfig(this.childConfig!, field)
                    : undefined);

                return Vector.make<any>(ReadableData.emptyData, {
                    childConfig,
                    config,
                    name: this._getChildName(index)
                });
            });

        this.#childFields = childFields;
        return childFields;
    }

    valueToJSON(values: T): any {
        return this.childFields.map((vector, index) => {
            const value = values[index];
            if (value == null || !vector.valueToJSON) return value;
            return vector.valueToJSON(value);
        });
    }

    private _getChildName(index: number) {
        if (!this.name) return undefined;
        return `${this.name}.${index}`;
    }
}
