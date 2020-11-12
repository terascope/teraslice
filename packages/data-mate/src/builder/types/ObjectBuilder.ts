import { getTypeOf, isPlainObject, toString } from '@terascope/utils';
import { createObject, WritableData } from '../../core';

import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class ObjectBuilder<
    T extends Record<string, any> = Record<string, any>
> extends Builder<T> {
    constructor(
        data: WritableData<T>,
        options: BuilderOptions
    ) {
        super(VectorType.Object, data, options);
    }

    valueFrom(value: unknown): T {
        if (!isPlainObject(value)) {
            throw new TypeError(`Expected ${toString(value)} (${getTypeOf(value)}) to be an object`);
        }

        if (this.childConfig == null) {
            return createObject({ ...value as T });
        }

        const fields = Object.keys(this.childConfig) as (keyof T)[];
        if (!fields.length) {
            return createObject({ ...value as T });
        }

        const input = value as Record<keyof T, unknown>;
        const result: Partial<T> = {};

        for (const field of fields) {
            if (input[field] != null) {
                const config = this.childConfig[field as string];
                // FIXME this could be improved to use the static method
                const builder = Builder.make<any>(config, WritableData.make(0));
                result[field] = builder.valueFrom ? builder.valueFrom(
                    input[field]
                ) : input[field];
            } else {
                result[field] = null as any;
            }
        }

        return createObject(result as T);
    }
}
