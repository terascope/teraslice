import { DateValue, WritableData } from '../../core';

import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class DateBuilder extends Builder<DateValue> {
    referenceDate = new Date();

    constructor(
        data: WritableData<DateValue>,
        options: BuilderOptions
    ) {
        super(VectorType.Date, data, options);
    }

    valueFrom(value: unknown): DateValue {
        // FIXME this should validate the format is correct
        if (value instanceof DateValue) return value;

        if (this.config.format) {
            return DateValue.fromValueWithFormat(
                value,
                this.config.format,
                this.referenceDate
            );
        }

        return DateValue.fromValue(value as any);
    }
}
