import { toFloatOrThrow } from '@terascope/utils';
import { WritableData } from '../../core';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class FloatBuilder extends Builder<number> {
    static valueFrom(value: unknown): number {
        return toFloatOrThrow(value);
    }

    constructor(
        data: WritableData<number>,
        options: BuilderOptions<number>
    ) {
        super(VectorType.Float, data, {
            valueFrom: FloatBuilder.valueFrom,
            ...options,
        });
    }
}
