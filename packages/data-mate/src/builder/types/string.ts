import { Maybe, Nil } from '@terascope/types';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

export class StringBuilder extends Builder<string> {
    static valueFrom(value: unknown): Maybe<string> {
        if (value == null) return value as Nil;
        return String(value);
    }

    constructor(options: BuilderOptions<string>) {
        super(VectorType.String, {
            valueFrom: StringBuilder.valueFrom,
            ...options,
        });
    }
}
