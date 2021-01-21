import { FieldType } from '@terascope/types';
import { Vector, VectorOptions } from '../Vector';
import { VectorType } from '../interfaces';
import { getObjectDataTypeConfig, ReadableData } from '../../core';

type ChildFields<T extends Record<string, any>> = readonly (
    [field: (keyof T), vector: Vector<any>]
)[];

export class ObjectVector<
    T extends Record<string, any> = Record<string, any>
> extends Vector<T> {
    #childFields?: ChildFields<T>;

    constructor(data: ReadableData<T>, options: VectorOptions) {
        super(VectorType.Object, data, options);
        this.sortable = false;
    }

    get childFields(): ChildFields<T> {
        if (this.#childFields) return this.#childFields;

        if (!this.childConfig) {
            this.#childFields = [];
            return this.#childFields;
        }
        const childFields: ChildFields<T> = Object.entries(this.childConfig)
            .map(([field, config]) => {
                const childConfig = (config.type === FieldType.Object
                    ? getObjectDataTypeConfig(this.childConfig!, field)
                    : undefined);

                const vector = Vector.make<any>(ReadableData.emptyData, {
                    childConfig,
                    config,
                    name: this._getChildName(field)
                });
                return [field, vector];
            });

        this.#childFields = childFields;
        return childFields;
    }

    valueToJSON(value: T): any {
        const val = value as Record<string, any>;
        if (!this.childFields.length) {
            return { ...val };
        }

        const input = value as Readonly<Record<keyof T, unknown>>;
        const result: Partial<T> = {};

        for (const [field, vector] of this.childFields) {
            if (input[field] != null) {
                result[field] = (
                    vector.valueToJSON ? vector.valueToJSON(input[field]) : input[field]
                );
            }
        }

        return result;
    }

    private _getChildName(field: string) {
        if (!this.name) return undefined;
        return `${this.name}.${field}`;
    }
}
