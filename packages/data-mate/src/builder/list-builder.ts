import { Maybe, Nil } from '@terascope/types';
import { castArray } from '@terascope/utils';
import { newBuilderForType } from './utils';
import { Builder, BuilderOptions } from './builder';
import { VectorType } from '../vector';

export class ListBuilder<T = unknown> extends Builder<Builder<T>> {
    static valueFrom(value: unknown, thisArg?: Builder<Builder<any>>): Maybe<Builder<any>> {
        if (value == null) return value as Nil;
        if (value instanceof Builder) return value;
        if (!thisArg) {
            throw new Error('Expected thisArg');
        }

        return newBuilderForType(thisArg.fieldType, castArray(value));
    }

    constructor(options: BuilderOptions<Builder<T>>) {
        super(VectorType.List, {
            valueFrom: ListBuilder.valueFrom,
            ...options,
        });
    }
}
