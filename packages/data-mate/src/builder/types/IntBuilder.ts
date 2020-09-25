import { getTypeOf, toInteger } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

/**
 * @todo enforce int sizes for Byte, Short, and Integer lengths
*/
export class IntBuilder extends Builder<number> {
    static valueFrom(value: unknown): number {
        const parsed = toInteger(value);
        if (parsed === false) {
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
