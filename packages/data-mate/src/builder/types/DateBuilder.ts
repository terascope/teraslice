import { DateFormat } from '@terascope/types';
import { DateValue } from '../../core-utils';
import { VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

export class DateBuilder extends Builder<DateValue> {
    static valueFrom(value: unknown, thisArg: DateBuilder): DateValue {
        if (value instanceof DateValue) return value;

        const { format } = thisArg.config;

        if (format && !(format in DateFormat)) {
            if (typeof value !== 'string') {
                throw new Error(`Expected string for formatted date fields, got ${value}`);
            }

            if (thisArg.referenceDate == null) {
                thisArg.referenceDate = new Date();
            }
            const referenceDate = thisArg.referenceDate!;
            return DateValue.fromValueToFormat(value, format, referenceDate);
        }

        if (format === DateFormat.epoch) {
            return DateValue.fromValueToEpoch(value as any);
        }

        const dateValue = DateValue.fromValue(
            value as any,
            format as DateFormat.iso_8601|DateFormat.epoch_millis
        );

        // auto set the date format so it is consistently stored
        if (!thisArg.config.format) {
            if (dateValue.formatted) {
                thisArg.config.format = DateFormat.iso_8601;
            } else {
                thisArg.config.format = DateFormat.epoch_millis;
            }
        }

        return dateValue;
    }

    referenceDate?: Date;

    constructor(options: BuilderOptions<DateValue>) {
        super(VectorType.Date, {
            valueFrom: DateBuilder.valueFrom,
            ...options,
        });
    }
}
