import { getTypeOf, isPlainObject, toString } from '@terascope/utils';
import { createObject } from '../../core-utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions, ValueFromFn } from '../Builder';

export class ObjectBuilder<
    T extends Record<string, any> = Record<string, any>
> extends Builder<T> {
    static valueFrom<
        R extends Record<string, any> = Record<string, any>
    >(value: unknown, thisArg?: ObjectBuilder<R>): R {
        if (!thisArg) {
            throw new Error('Expected thisArg');
        }
        if (!isPlainObject(value)) {
            throw new TypeError(`Expected ${toString(value)} (${getTypeOf(value)}) to be an object`);
        }

        if (thisArg.childConfig == null) {
            return createObject(value as R);
        }

        const fields = Object.keys(thisArg.childConfig) as (keyof R)[];
        if (!fields.length) {
            return createObject(value as R);
        }

        const input = value as Record<keyof R, unknown>;
        const result: Partial<R> = {};

        for (const field of fields) {
            if (input[field] == null) {
                result[field] = null as any;
            } else {
                const config = thisArg.childConfig[field as string];
                // FIXME this could be improved to use the static method
                const builder = Builder.make<any>(config);
                result[field] = builder.valueFrom ? builder.valueFrom(
                    input[field], builder
                ) : input[field] as any;
            }
        }

        return createObject(result as R);
    }

    constructor(options: BuilderOptions<T>) {
        super(VectorType.Object, {
            valueFrom: ObjectBuilder.valueFrom as ValueFromFn<T>,
            ...options,
        });
    }

    indexOf(value: T): number {
        return this.values.indexOf(value);
    }
}
