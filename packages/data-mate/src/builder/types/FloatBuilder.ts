import { getTypeOf, toFloat } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class FloatBuilder extends Builder<number> {
    static valueFrom(value: unknown): number {
        const parsed = toFloat(value);
        if (parsed === false) {
            throw new TypeError(`Expected ${parsed} (${getTypeOf(value)}) to be a valid float`);
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
