import { isPlainObject, toString } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

/**
 * @todo we need to figure out nested fields
*/
export class ObjectBuilder<
    T extends Record<string, any> = Record<string, any>
> extends Builder<T> {
    static valueFrom<
        R extends Record<string, any> = Record<string, any>
    >(value: unknown): R {
        if (!isPlainObject(value)) {
            throw new TypeError(`Expected ${toString(value)} to be an object`);
        }
        return { ...(value as R) };
    }

    constructor(options: BuilderOptions<T>) {
        super(VectorType.Object, {
            valueFrom: ObjectBuilder.valueFrom,
            ...options,
        });
    }
}
