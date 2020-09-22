import { getTypeOf } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

export class FloatBuilder extends Builder<number> {
    static valueFrom(value: unknown): number {
        const parsed = parseFloat(value as any);
        if (Number.isNaN(parsed)) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a valid float`);
        }
        return parsed;
    }

    constructor(options: BuilderOptions<number>) {
        super(VectorType.Float, {
            valueFrom: FloatBuilder.valueFrom,
            ...options,
        });
    }
}
