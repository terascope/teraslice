import {
    getValidDate,
    isValidDateInstance, toInteger
} from '@terascope/utils';
import { LRUMap } from 'mnemonist';
import parseDate from 'date-fns/parse';
import formatDate from 'date-fns/format';
import { DateFormat } from '@terascope/types';
import { HASH_CODE_SYMBOL } from './interfaces';

const cache = new LRUMap<string, DateValue>(100_000);

/**
 * The internal date storage format
*/
export class DateValue {
    // date-fns doesn't handle utc correctly here
    // https://github.com/date-fns/date-fns/issues/376
    // https://github.com/date-fns/date-fns/blob/d0efa9eae1cf05c0e27461296b537b9dd46283d4/src/format/index.js#L399-L403
    static timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

    static fromValueToFormat(value: string, format: string, referenceDate: Date): DateValue {
        const cacheKey = `${value}:${format}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const date = parseDate(value, format, referenceDate);
        if (!isValidDateInstance(date)) {
            throw new Error(`Expected value ${value} to be a date string with format ${format}`);
        }

        const timeWithOffset = date.getTime() + DateValue.timezoneOffset;
        const dateValue = new DateValue(timeWithOffset, value);
        cache.set(cacheKey, dateValue);
        return dateValue;
    }

    static fromValueToEpoch(value: Date|string|number): DateValue {
        const cacheKey = `${value}:${DateFormat.epoch}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const epoch = toInteger(value);
        if (epoch === false || epoch < 0) {
            throw new Error(`Expected value ${value} to be a valid time`);
        }

        const epochMillis = Math.floor(epoch * 1000);
        if (epochMillis < 0 || !Number.isSafeInteger(epochMillis)) {
            throw new Error(`Expected value ${value} to be a valid time`);
        }

        const dateValue = new DateValue(epochMillis, epoch);
        cache.set(cacheKey, dateValue);
        return dateValue;
    }

    static fromValue(
        value: string|number|Date,
        defaultFormat?: DateFormat.iso_8601|DateFormat.epoch_millis
    ): DateValue {
        const cacheKey = `${value}:${defaultFormat}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const date = getValidDate(value as any);
        if (date === false) {
            throw new Error(`Expected value ${value} to be a valid date`);
        }

        const storeInISO = (
            typeof value === 'string'
            || value instanceof Date
            || defaultFormat === DateFormat.iso_8601
        );

        const dateValue = new DateValue(
            date.getTime(),
            storeInISO ? date.toISOString() : undefined
        );
        cache.set(cacheKey, dateValue);
        return dateValue;
    }

    static fromValueWithFormat(
        value: unknown,
        format: DateFormat|string,
        referenceDate: Date
    ): DateValue {
        if (format && !(format in DateFormat)) {
            if (typeof value !== 'string') {
                throw new Error(`Expected string for formatted date fields, got ${value}`);
            }

            return DateValue.fromValueToFormat(value, format, referenceDate!);
        }

        if (format === DateFormat.epoch) {
            return DateValue.fromValueToEpoch(value as any);
        }

        return DateValue.fromValue(
            value as any,
            format as DateFormat.iso_8601|DateFormat.epoch_millis
        );
    }

    static reformat(value: DateValue, format: string|DateFormat): DateValue {
        const timeWithAdditionalOffset = value.value + DateValue.timezoneOffset;
        const formatted = formatDate(timeWithAdditionalOffset, format);
        return new DateValue(value.value, formatted);
    }

    /**
     * The original formatted date
    */
    readonly formatted: string|number|undefined;

    /**
     * Date stored in epoch milliseconds
    */
    readonly value: number;

    constructor(epochMillis: number, formatted?: string|number) {
        this.value = epochMillis;
        if (epochMillis === formatted || !formatted) {
            this.formatted = undefined;
        } else {
            this.formatted = formatted;
        }
    }

    [Symbol.toPrimitive](hint: 'string'|'number'|'default'): any {
        if (hint === 'number') return this.value;
        if (!this.formatted) return new Date(this.value).toISOString();
        return `${this.formatted}`;
    }

    get [HASH_CODE_SYMBOL](): string {
        return `${this.formatted ?? this.value}`;
    }
}
