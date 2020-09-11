import { Maybe, Nil } from '@terascope/types';
import { toBoolean } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

export class BooleanBuilder extends Builder<boolean> {
    static valueFrom(value: unknown): Maybe<boolean> {
        if (value == null) return value as Nil;
        return toBoolean(value);
    }

    constructor(options: BuilderOptions<boolean>) {
        super(VectorType.Boolean, {
            valueFrom: BooleanBuilder.valueFrom,
            ...options,
        });
    }
}
