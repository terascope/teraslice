import {
    isValidDateInstance, getTime, toInteger
} from '@terascope/utils';
import parseDate from 'date-fns/parse';
import formatDate from 'date-fns/format';
import { DateFormat } from '@terascope/types';

// date-fns doesn't handle utc correctly here
// https://github.com/date-fns/date-fns/issues/376
// https://github.com/date-fns/date-fns/blob/d0efa9eae1cf05c0e27461296b537b9dd46283d4/src/format/index.js#L399-L403
export const timezoneOffset = new Date().getTimezoneOffset() * 60_000;

export function parseCustomDateFormat(
    value: unknown,
    format: string,
    referenceDate: Date
): number {
    if (typeof value !== 'string') {
        throw new Error(`Expected string for formatted date fields, got ${value}`);
    }

    const date = parseDate(value, format, referenceDate);
    if (!isValidDateInstance(date)) {
        throw new Error(`Expected value ${value} to be a date string with format ${format}`);
    }

    // need subtract the date offset here to
    // in order to deal with UTC time
    return date.getTime() - (date.getTimezoneOffset() * 60_000);
}

/**
 * Parse a date value (that has already been validated)
 * and return the epoch millis time
*/
export function parseDateValue(
    value: unknown,
    format: DateFormat|string|undefined,
    referenceDate: Date
): number {
    if (format === DateFormat.epoch || format === DateFormat.seconds) {
        const int = toInteger(value);
        if (int === false) {
            throw new Error(`Expected value ${value} to be a valid time`);
        }
        return Math.floor(int * 1000);
    }

    if (format && !(format in DateFormat)) {
        return parseCustomDateFormat(value, format, referenceDate);
    }

    const result = getTime(value as any);
    if (result === false) {
        throw new Error(`Expected value ${value} to be a valid date`);
    }
    return result;
}

/**
 * Format the parsed date value
*/
export function formatDateValue(
    value: number,
    format: DateFormat|string|undefined,
): string|number {
    if (format === DateFormat.epoch_millis || format === DateFormat.milliseconds) {
        return value;
    }

    if (format === DateFormat.epoch || format === DateFormat.seconds) {
        return Math.floor(value / 1000);
    }

    if (format && !(format in DateFormat)) {
        // need subtract our offset here to
        // in order to deal with UTC time
        return formatDate(value - timezoneOffset, format);
    }

    return new Date(value).toISOString();
}
