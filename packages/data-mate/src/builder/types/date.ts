import { getTypeOf, getValidDate } from '@terascope/utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

/**
 * @todo this should probably be stored as time in milliseconds
 *      with the format and timezone metadata
 */
export class DateBuilder extends Builder<number> {
    static valueFrom(value: unknown): number {
        const date = getValidDate(value);
        if (!date) {
            throw new Error(`Expected ${value} (${getTypeOf(value)}) to be in a valid date format`);
        }
        return date.getTime();
    }

    constructor(options: BuilderOptions<number>) {
        super(VectorType.Date, {
            valueFrom: DateBuilder.valueFrom,
            ...options,
        });
    }
}
