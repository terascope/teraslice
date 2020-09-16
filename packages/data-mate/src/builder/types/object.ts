import { DataTypeFields } from '@terascope/types';
import { isPlainObject, toString } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions, ValueFromFn } from '../builder';

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
            throw new TypeError(`Expected ${toString(value)} to be an object`);
        }

        const fields = Object.keys(thisArg.childConfig) as (keyof R)[];
        if (!fields.length) return { ...(value as R) };

        const input = value as Record<keyof R, unknown>;
        const result: Partial<R> = {};
        for (const field of fields) {
            const config = thisArg.childConfig[field as string];
            const builder = Builder.make<any>(config);
            if (input[field] == null) {
                result[field] = null as any;
            } else if (builder.valueFrom) {
                result[field] = builder.valueFrom(
                    input[field], builder
                );
            } else {
                result[field] = input[field] as any;
            }
        }
        return result as R;
    }

    childConfig: DataTypeFields;

    constructor(options: BuilderOptions<T> & { childConfig?: DataTypeFields }) {
        super(VectorType.Object, {
            valueFrom: ObjectBuilder.valueFrom as ValueFromFn<T>,
            ...options,
        });
        this.childConfig = options.childConfig ?? {};
    }
}
