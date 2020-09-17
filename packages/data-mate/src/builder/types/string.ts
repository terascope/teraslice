import { toString } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

/**
 * @todo this should only toString js primitives
*/
export class StringBuilder extends Builder<string> {
    static valueFrom(value: unknown): string {
        return toString(value);
    }

    constructor(options: BuilderOptions<string>) {
        super(VectorType.String, {
            valueFrom: StringBuilder.valueFrom,
            ...options,
        });
    }
}
