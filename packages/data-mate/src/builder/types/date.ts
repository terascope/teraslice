import { getTypeOf, getValidDate } from '@terascope/utils';
import { DateValue, VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../builder';

/**
 * @todo this should probably be stored as time in milliseconds
 *      with the format and timezone metadata
 */
export class DateBuilder extends Builder<DateValue> {
    static valueFrom(value: unknown): DateValue {
        const date = getValidDate(value as any);
        if (date === false) {
            throw new Error(`Expected ${value} (${getTypeOf(value)}) to be in a valid date format`);
        }
        return date.getTime();
    }

    constructor(options: BuilderOptions<DateValue>) {
        super(VectorType.Date, {
            valueFrom: DateBuilder.valueFrom,
            ...options,
        });
    }
}
