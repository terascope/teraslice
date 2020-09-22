import { getTypeOf } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

/**
 * @todo enforce int sizes for Byte, Short, and Integer lengths
*/
export class IntBuilder extends Builder<number> {
    static valueFrom(value: unknown): number {
        if (Number.isSafeInteger(value)) {
            return value as number;
        }
        const parsed = parseInt(value as string, 10);
        if (Number.isNaN(parsed)) {
            throw new TypeError(`Expected ${parsed} (${getTypeOf(value)}) to be a valid integer`);
        }
        return parsed;
    }

    constructor(options: BuilderOptions<number>) {
        super(VectorType.Int, {
            valueFrom: IntBuilder.valueFrom,
            ...options,
        });
    }
}
