import { getValidDate, isValidDateInstance, toInteger } from '@terascope/utils';
import parseDate from 'date-fns/parse';
import { DateFormat } from '@terascope/types';
import { DateValue, VectorType } from '../../vector';
import { Builder, BuilderOptions } from '../Builder';

const systemTimezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

export class DateBuilder extends Builder<DateValue> {
    static valueFrom(value: unknown, thisArg: DateBuilder): DateValue {
        if (value instanceof DateValue) return value;

        const { format } = thisArg.config;

        if (format && !(format in DateFormat)) {
            if (typeof value !== 'string') {
                throw new Error(
                    'Expected string values when using toDate({ format })'
                );
            }

            const date = parseDate(value, format, Date.now());
            if (!isValidDateInstance(date)) {
                throw new Error(`Expected value ${value} to be a date string with format ${format}`);
            }

            const epochMillis = date.getTime() - systemTimezoneOffset;
            return new DateValue(epochMillis, value);
        }

        if (format === DateFormat.epoch) {
            const epoch = toInteger(value);
            if (epoch === false || epoch < 0) {
                throw new Error(`Expected value ${value} to be a valid time`);
            }

            const epochMillis = Math.floor(epoch * 1000);
            if (epochMillis < 0 || !Number.isSafeInteger(epochMillis)) {
                throw new Error(`Expected value ${value} to be a valid time`);
            }

            return new DateValue(epochMillis, epoch);
        }

        const date = getValidDate(value as any);
        if (date === false) {
            throw new Error(`Expected value ${value} to be a valid date`);
        }

        if (typeof value === 'string'
            || value instanceof Date
            || thisArg.config.format === DateFormat.iso_8601) {
            if (!thisArg.config.format) {
                thisArg.config.format = DateFormat.iso_8601;
            }
            return new DateValue(date.getTime(), date.toISOString());
        }

        if (!thisArg.config.format) {
            thisArg.config.format = DateFormat.epoch_millis;
        }
        return new DateValue(date.getTime());
    }

    constructor(options: BuilderOptions<DateValue>) {
        super(VectorType.Date, {
            valueFrom: DateBuilder.valueFrom,
            ...options,
        });
    }
}
