import { getTypeOf, toString } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

function isToStringable(value: unknown): boolean {
    const type = typeof value;
    if (type === 'string') return true;
    if (type === 'boolean') return true;
    if (type === 'number') return true;
    if (type === 'bigint') return true;
    if (type === 'symbol') return true;
    if (value instanceof Date) return true;
    return false;
}

/**
 * @todo this should only toString js primitives
*/
export class StringBuilder extends Builder<string> {
    static valueFrom(value: unknown): string {
        if (!isToStringable(value)) {
            throw new Error(`Expected ${value} (${getTypeOf(value)}) to be in a string like format`);
        }
        return toString(value);
    }

    constructor(options: BuilderOptions<string>) {
        super(VectorType.String, {
            valueFrom: StringBuilder.valueFrom,
            ...options,
        });
    }
}
