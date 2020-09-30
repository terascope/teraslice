import { castArray } from '@terascope/utils';
import { Builder, BuilderOptions } from './Builder';
import { Vector, VectorType } from '../vector';
import { isSameFieldConfig } from '../core-utils';

export class ListBuilder<T = unknown> extends Builder<Vector<T>> {
    static valueFrom(values: unknown, thisArg?: ListBuilder<any>): Vector<any> {
        if (!thisArg) {
            throw new Error('Expected thisArg');
        }
        let arr: unknown[];
        if (values instanceof Vector) {
            if (isSameFieldConfig(values.config, thisArg.config)) {
                return values;
            }
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

    isPrimitive = false;

    constructor(options: BuilderOptions<Vector<T>>) {
        super(VectorType.List, {
            valueFrom: ListBuilder.valueFrom,
            ...options,
        });
    }
}
