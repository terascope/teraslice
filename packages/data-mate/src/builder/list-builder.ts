import { castArray } from '@terascope/utils';
import { DataTypeFields } from '@terascope/types';
import { Builder, BuilderOptions } from './builder';
import { Vector, VectorType } from '../vector';

export class ListBuilder<T = unknown> extends Builder<Vector<T>> {
    static valueFrom(values: unknown, thisArg?: ListBuilder<any>): Vector<any> {
        if (!thisArg) {
            throw new Error('Expected thisArg');
        }
        let arr: unknown[];
        if (values instanceof Vector) {
            if (values.type === thisArg.type) return values;
            arr = [...values];
        } else {
            arr = castArray(values);
        }

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
