import { getTypeOf, isBooleanLike, toBoolean } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class BooleanBuilder extends Builder<boolean> {
    constructor(
        data: WritableData<boolean>,
        options: BuilderOptions
    ) {
        super(VectorType.Boolean, data, options);
    }

    _valueFrom(value: unknown): boolean {
        if (!isBooleanLike(value)) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be boolean like`);
        }
        return toBoolean(value);
    }
}
