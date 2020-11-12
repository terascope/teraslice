import { FieldType } from '@terascope/types';
import { getTypeOf, isPlainObject, toString } from '@terascope/utils';
import { createObject, getObjectDataTypeConfig, WritableData } from '../../core';

import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

const emptyData = WritableData.make(0);
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

        const childFields: ChildFields<T> = Object.entries(this.childConfig ?? {})
            .map(([field, config]) => {
                const childConfig = (config.type === FieldType.Object
                    ? getObjectDataTypeConfig(this.childConfig!, field as string)
                    : undefined);
                const builder = Builder.make<any>(
                    config, emptyData, childConfig
                );
                return [field, builder];
            });
        this.#childFields = childFields;
        return childFields;
    }

    valueFrom(value: unknown): T {
        if (!isPlainObject(value)) {
            throw new TypeError(`Expected ${toString(value)} (${getTypeOf(value)}) to be an object`);
        }

        if (!this.childFields.length) {
            return createObject({ ...value as T });
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

        return createObject(result as T);
    }
}
