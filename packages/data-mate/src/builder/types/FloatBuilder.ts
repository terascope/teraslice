import { toFloatOrThrow } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class FloatBuilder extends Builder<number> {
    static valueFrom(value: unknown): number {
        return toFloatOrThrow(value);
    }

    constructor(options: BuilderOptions<number>) {
        super(VectorType.Float, {
            valueFrom: FloatBuilder.valueFrom,
            ...options,
        });
    }
}
