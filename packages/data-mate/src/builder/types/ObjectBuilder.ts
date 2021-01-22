import { FieldType } from '@terascope/types';
import {
    getTypeOf, isNotNil, isPlainObject, sortBy, toString
} from '@terascope/utils';
import { createObjectValue, getObjectDataTypeConfig, WritableData } from '../../core';

import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';
import { BuilderWithCache } from '../BuilderWithCache';

type ChildFields<T extends Record<string, any>> = readonly (
    [field: (keyof T), builder: Builder<any>]
)[];

export class ObjectBuilder<
    T extends Record<string, any> = Record<string, any>
> extends BuilderWithCache<T> {
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
            .map(([field, config]): [string, Builder<any>]|undefined => {
                const [base] = field.split('.');
                if (base !== field && this.childConfig![base]) return;

                const childConfig = (config.type === FieldType.Object
                    ? getObjectDataTypeConfig(this.childConfig!, field)
                    : undefined);

                const builder = Builder.make<any>(WritableData.emptyData, {
                    childConfig,
                    config,
                    name: this._getChildName(field),
                });
                return [field, builder];
            })
            .filter(isNotNil) as ChildFields<T>;

        this.#childFields = sortBy(childFields as [string, Builder<any>][], '[0]');
        return childFields;
    }

    _valueFrom(value: unknown): T {
        if (!isPlainObject(value)) {
            throw new TypeError(`Expected ${toString(value)} (${getTypeOf(value)}) to be an object`);
        }

        if (!this.childFields.length) {
            return createObjectValue({ ...value as T }, false);
        }

        const input = value as Readonly<Record<keyof T, unknown>>;
        const result: Partial<T> = Object.create(null);

        for (const [field, builder] of this.childFields) {
            if (input[field] != null) {
                const fieldValue: any = builder.valueFrom(input[field]);
                Object.defineProperty(result, field, {
                    value: fieldValue,
                    enumerable: true,
                    writable: false
                });
            }
        }

        return createObjectValue(result as T, true);
    }

    private _getChildName(field: string) {
        if (!this.name) return undefined;
        return `${this.name}.${field}`;
    }
}
