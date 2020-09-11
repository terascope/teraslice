import { Maybe, Nil } from '@terascope/types';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

export class IntBuilder extends Builder<number> {
    static valueFrom(value: unknown): Maybe<number> {
        if (value == null) return value as Nil;
        return parseInt(value as any, 10);
    }

    constructor(options: BuilderOptions<number>) {
        super(VectorType.Int, {
            valueFrom: IntBuilder.valueFrom,
            ...options,
        });
    }
}
