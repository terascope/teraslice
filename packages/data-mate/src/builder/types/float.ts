import { Maybe, Nil } from '@terascope/types';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

export class FloatBuilder extends Builder<number> {
    static valueFrom(value: unknown): Maybe<number> {
        if (value == null) return null;
        return parseFloat(value as any);
    }

    constructor(options: BuilderOptions<number>) {
        super(VectorType.Float, {
            valueFrom: FloatBuilder.valueFrom,
            ...options,
        });
    }
}
