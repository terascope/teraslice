import { getTypeOf, isBooleanLike, toBoolean } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class BooleanBuilder extends Builder<boolean> {
    static valueFrom(value: unknown): boolean {
        if (!isBooleanLike(value)) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be boolean like`);
        }
        return toBoolean(value);
    }

    constructor(
        data: WritableData<boolean>,
        options: BuilderOptions<boolean>
    ) {
        super(VectorType.Boolean, data, {
            valueFrom: BooleanBuilder.valueFrom,
            ...options,
        });
    }
}
