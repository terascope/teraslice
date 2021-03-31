import { FieldType } from '@terascope/types';
import {
    getTypeOf, isArrayLike, toString, TSError
} from '@terascope/utils';
import {
    createArrayValue, getChildDataTypeConfig, WritableData
} from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';
import { BuilderWithCache } from '../BuilderWithCache';

type ChildFields = readonly Builder<any>[];

export class TupleBuilder<T extends [...any] = [...any]> extends BuilderWithCache<T> {
    #childFields?: ChildFields;

    constructor(
        data: WritableData<T>,
        options: BuilderOptions
    ) {
        super(VectorType.Tuple, data, options);
        if (!this.childConfig || !Object.keys(this.childConfig).length) {
            throw new TSError(`${FieldType.Tuple} field types require at least one field`, {
                context: { safe: true },
                statusCode: 400
            });
        }
    }

    get childFields(): ChildFields {
        if (this.#childFields) return this.#childFields;

        if (!this.childConfig) {
            this.#childFields = [];
            return this.#childFields;
        }

        const childFields: ChildFields = Object.entries(this.childConfig)
            .map(([field, config], index) => Builder.make<any>(WritableData.emptyData, {
                childConfig: getChildDataTypeConfig(
                    this.childConfig!, field, config.type as FieldType
                ),
                config,
                name: this._getChildName(index),
            }));

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

    private _getChildName(index: number): string|undefined {
        if (!this.name) return undefined;
        return `${this.name}.${index}`;
    }
}
