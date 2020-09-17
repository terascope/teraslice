import { castArray } from '@terascope/utils';
import { DataTypeFields } from '@terascope/types';
import { Builder, BuilderOptions } from './builder';
import { Vector, VectorType } from '../vector';

export class ListBuilder<T = unknown> extends Builder<Vector<T>> {
    static valueFrom(values: unknown, thisArg?: ListBuilder<any>): Vector<any> {
        if (values instanceof Vector) return values;
        if (!thisArg) {
            throw new Error('Expected thisArg');
        }

        const arr = castArray(values);
        const builder = Builder.make({
            ...thisArg.config,
            array: false,
        }, arr.length, thisArg.childConfig);
        arr.forEach((value) => builder.append(value));
        return builder.toVector();
    }

    childConfig?: DataTypeFields;

    constructor(options: BuilderOptions<Vector<T>> & { childConfig?: DataTypeFields }) {
        super(VectorType.List, {
            valueFrom: ListBuilder.valueFrom,
            ...options,
        });
        this.childConfig = options.childConfig;
    }
}
