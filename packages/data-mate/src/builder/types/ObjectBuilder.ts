import { FieldType } from '@terascope/types';
import { getTypeOf, isPlainObject, toString } from '@terascope/utils';
import { createObjectValue, getObjectDataTypeConfig, WritableData } from '../../core';

import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

type ChildFields<T extends Record<string, any>> = readonly (
    [field: (keyof T), builder: Builder<any>]
)[];

export class ObjectBuilder<
    T extends Record<string, any> = Record<string, any>
> extends Builder<T> {
    #childFields?: ChildFields<T>;

    constructor(
        data: WritableData<T>,
        options: BuilderOptions
    ) {
        super(VectorType.Object, data, options);
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

                const builder = Builder.make<any>(WritableData.emptyData, {
                    childConfig,
                    config,
                    name: this._getChildName(field),
                });
                return [field, builder];
            });

        this.#childFields = childFields;
        return childFields;
    }

    _valueFrom(value: unknown): T {
        if (!isPlainObject(value)) {
            throw new TypeError(`Expected ${toString(value)} (${getTypeOf(value)}) to be an object`);
        }

        if (!this.childFields.length) {
            return createObjectValue({ ...value as T });
        }

        const input = value as Record<keyof T, unknown>;
        const result: Partial<T> = {};

        for (const [field, builder] of this.childFields) {
            if (input[field] != null) {
                result[field] = builder.valueFrom(input[field]);
            } else {
                result[field] = null as any;
            }
        }

        return createObjectValue(result as T);
    }

    private _getChildName(field: string) {
        if (!this.name) return undefined;
        return `${this.name}.${field}`;
    }
}
