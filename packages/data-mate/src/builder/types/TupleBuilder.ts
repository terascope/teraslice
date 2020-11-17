import { FieldType } from '@terascope/types';
import { getTypeOf, isArrayLike, toString } from '@terascope/utils';
import {
    createArrayValue, getObjectDataTypeConfig, WritableData
} from '../../core';

import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

type ChildFields = readonly Builder<any>[];

export class TupleBuilder<T extends [...any] = [...any]> extends Builder<T> {
    #childFields?: ChildFields;

    constructor(
        data: WritableData<T>,
        options: BuilderOptions
    ) {
        super(VectorType.Tuple, data, options);
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

                return Builder.make<any>(WritableData.emptyData, {
                    childConfig,
                    config,
                    name: this._getChildName(index),
                });
            });

        this.#childFields = childFields;
        return childFields;
    }

    _valueFrom(values: unknown): T {
        if (!isArrayLike(values)) {
            throw new TypeError(`Expected ${toString(values)} (${getTypeOf(values)}) to be an array`);
        }
        const len = this.childFields.length;
        if (values.length > len) {
            throw new TypeError(`Expected ${toString(values)} (${getTypeOf(values)}) to have a length of ${len}`);
        }

        return createArrayValue(this.childFields.map((builder, index) => {
            const value = values[index];
            return value != null ? builder.valueFrom(value) : null;
        })) as T;
    }

    private _getChildName(index: number) {
        if (!this.name) return undefined;
        return `${this.name}.${index}`;
    }
}
