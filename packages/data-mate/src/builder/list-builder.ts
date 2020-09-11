import { Maybe } from '@terascope/types';
import { castArray } from '@terascope/utils';
import { newBuilderForType } from './utils';
import { Builder, BuilderOptions } from './builder';
import { Vector, VectorType } from '../vector';

export class ListBuilder<T = unknown> extends Builder<Vector<T>> {
    static valueFrom(values: unknown, thisArg?: Builder<Vector<any>>): Maybe<Vector<any>> {
        if (values == null) return null;
        if (values instanceof Vector) return values;
        if (!thisArg) {
            throw new Error('Expected thisArg');
        }

        const builder = newBuilderForType({
            ...thisArg.config,
            array: false,
        });
        castArray(values).forEach((value) => builder.append(value));
        return builder.toVector();
    }

    constructor(options: BuilderOptions<Vector<T>>) {
        super(VectorType.List, {
            valueFrom: ListBuilder.valueFrom,
            ...options,
        });
    }
}
