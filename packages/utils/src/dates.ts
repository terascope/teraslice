import validator from 'validator';
import parseDate from 'date-fns/parse';
import formatDate from 'date-fns/lightFormat';
import {
    differenceInMilliseconds,
    differenceInSeconds,
    differenceInMinutes,
    differenceInHours,
    differenceInDays,
    differenceInCalendarDays,
    differenceInBusinessDays,
    differenceInWeeks,
    differenceInCalendarISOWeeks,
    differenceInMonths,
    differenceInCalendarMonths,
    differenceInQuarters,
    differenceInCalendarQuarters,
    differenceInYears,
    differenceInCalendarYears,
    differenceInCalendarISOWeekYears,
    differenceInISOWeekYears,
    intervalToDuration,
    formatISODuration,
    isFuture as dateFnIsFuture,
    isPast as dateFnIsPast,
} from 'date-fns';
import { DateFormat, ISO8601DateSegment, TimeBetweenFormats } from '@terascope/types';
import { getTypeOf } from './deps';
import {
    bigIntToJSON, isNumber, toInteger
} from './numbers';
import { isString } from './strings';

// date-fns doesn't handle utc correctly here
// https://github.com/date-fns/date-fns/issues/376
// https://github.com/date-fns/date-fns/blob/d0efa9eae1cf05c0e27461296b537b9dd46283d4/src/format/index.js#L399-L403
export const timezoneOffset = new Date().getTimezoneOffset() * 60_000;

/**
 * A helper function for making an ISODate string
 */
export function makeISODate(value?: Date|number|string|null|undefined): string {
    if (value == null) return new Date().toISOString();
    const date = getValidDate(value);
    if (date === false) {
        throw new Error(`Invalid date ${date}`);
    }
    return date.toISOString();
}

/** A simplified implementation of moment(new Date(val)).isValid() */
export function isValidDate(val: unknown): boolean {
    return getValidDate(val as any) !== false;
}

/**
 * Coerces value into a valid date, returns false if it is invalid
*/
export function getValidDate(val: unknown): Date | false {
    if (val == null) return false;
    if (val instanceof Date) {
        if (!isValidDateInstance(val)) {
            return false;
        }
        return val;
    }

    if (typeof val === 'bigint') {
        // eslint-disable-next-line no-param-reassign
        val = bigIntToJSON(val);
        if (typeof val === 'string') return false;
    }

    if (typeof val === 'number' && (!Number.isSafeInteger(val))) {
        return false;
    }

    const d = new Date(val as string);
    if (isValidDateInstance(d)) return d;
    return false;
}

/**
 * Returns a valid date or throws, {@see getValidDate}
*/
export function getValidDateOrThrow(val: unknown): Date {
    const date = getValidDate(val as any);
    if (date === false) {
        throw new TypeError(`Expected ${val} (${getTypeOf(val)}) to be in a standard date format`);
    }
    return date;
}

/**
 * Returns a valid date or throws, {@see getValidDate}
*/
export function getValidDateOrNumberOrThrow(val: unknown): Date|number {
    if (typeof val === 'number' && (!Number.isSafeInteger(val))) {
        return val;
    }

    const date = getValidDate(val as any);
    if (date === false) {
        throw new TypeError(`Expected ${val} (${getTypeOf(val)}) to be in a standard date format`);
    }
    return date;
}

export function isValidDateInstance(val: unknown): val is Date {
    // this has to use isNaN not Number.isNaN
    return val instanceof Date && !isNaN(val as any);
}

/** Ensure unix time */
export function getTime(val?: string|number|Date): number | false {
    if (val == null) return Date.now();
    const result = getValidDate(val);
    if (result === false) return false;
    return result.getTime();
}

export function getUnixTime(val?: string|number|Date): number | false {
    const time = getTime(val);
    if (time !== false) return Math.floor(time / 1000);
    return time;
}

/**
 * Checks to see if an input is a unix time
*/
export function isUnixTime(input: unknown, allowBefore1970 = true): input is number {
    const value = toInteger(input);
    if (value === false) return false;
    if (allowBefore1970) return true;
    return value >= 0;
}

/**
 * A functional version of isUnixTime
*/
export function isUnixTimeFP(allowBefore1970?: boolean) {
    return function _isUnixTime(input: unknown): input is number {
        return isUnixTime(input, allowBefore1970);
    };
}

/**
 * Checks to see if an input is a ISO 8601 date
*/
export function isISO8601(input: unknown): input is string {
    if (!isString(input)) return false;

    return validator.isISO8601(input);
}

/**
 * Convert a value to an ISO 8601 date string.
 * This should be used over makeISODate
*/
export function toISO8061(value: unknown): string {
    if (isNumber(value)) {
        return new Date(value).toISOString();
    }

    return makeISODate(value as any);
}

/**
 * Returns a function to trim the ISO 8601 date segment, this useful
 * for creating yearly, monthly, daily or hourly dates
*/
export function trimISODateSegment(segment: ISO8601DateSegment): (input: unknown) => number {
    return function _trimISODate(input) {
        const date = getValidDateOrThrow(input);

        if (segment === ISO8601DateSegment.hourly) {
            return new Date(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                date.getUTCHours(),
                0,
                0,
                0
            ).getTime() - timezoneOffset;
        }

        if (segment === ISO8601DateSegment.daily) {
            return new Date(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                0,
                0,
                0,
                0
            ).getTime() - timezoneOffset;
        }

        if (segment === ISO8601DateSegment.monthly) {
            return new Date(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                1,
                0,
                0,
                0,
                0
            ).getTime() - timezoneOffset;
        }

        if (segment === ISO8601DateSegment.yearly) {
            return new Date(
                date.getUTCFullYear(),
                0,
                1,
                0,
                0,
                0,
                0
            ).getTime() - timezoneOffset;
        }

        throw new Error(`Invalid segment "${segment}" given`);
    };
}

/**
 * track a timeout to see if it expires
 * @returns a function that will returns false if the time elapsed
 */
export function trackTimeout(timeoutMs: number): () => number | false {
    const startTime = Date.now();

    return (): false | number => {
        const elapsed = Date.now() - startTime;
        if (timeoutMs > -1 && elapsed > timeoutMs) {
            return elapsed;
        }
        return false;
    };
}

/** converts smaller than a week milliseconds to human readable time */
export function toHumanTime(ms: number): string {
    const ONE_SEC = 1000;
    const ONE_MIN = ONE_SEC * 60;
    const ONE_HOUR = ONE_MIN * 60;
    const ONE_DAY = ONE_HOUR * 24;
    const minOver = 1.5;
    if (ms > ONE_DAY * minOver && ms < ONE_DAY * 7) {
        return `~${Math.round((ms * 100) / ONE_DAY) / 100}day`;
    }
    if (ms > ONE_HOUR * minOver) return `~${Math.round((ms * 100) / ONE_HOUR) / 100}hr`;
    if (ms > ONE_MIN * minOver) return `~${Math.round((ms * 100) / ONE_MIN) / 100}min`;
    if (ms > ONE_SEC * minOver) {
        return `~${Math.round((ms * 100) / ONE_SEC) / 100}sec`;
    }
    if (ms < ONE_SEC * minOver) {
        return `${Math.round(ms)}ms`;
    }
    return `~${Math.round((ms * 100) / ONE_DAY) / 100}day`;
}

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
 * and return the epoch millis time.
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
    value: Date|number,
    format: DateFormat|string|undefined,
): string|number {
    if (format === DateFormat.epoch_millis || format === DateFormat.milliseconds) {
        return value instanceof Date ? value.getTime() : value;
    }

    if (format === DateFormat.epoch || format === DateFormat.seconds) {
        const ms = value instanceof Date ? value.getTime() : value;
        return Math.floor(ms / 1000);
    }

    if (format && !(format in DateFormat)) {
        const ms = value instanceof Date ? value.getTime() : value;
        // need add our offset here to
        // in order to deal with UTC time
        return formatDate(ms + timezoneOffset, format);
    }

    if (value instanceof Date) return value.toISOString();
    return new Date(value).toISOString();
}

const _getDurationFunc = {
    milliseconds: differenceInMilliseconds,
    seconds: differenceInSeconds,
    minutes: differenceInMinutes,
    hours: differenceInHours,
    days: differenceInDays,
    calendarDays: differenceInCalendarDays,
    businessDays: differenceInBusinessDays,
    weeks: differenceInWeeks,
    calendarWeeks: differenceInCalendarISOWeeks,
    months: differenceInMonths,
    calendarMonths: differenceInCalendarMonths,
    quarters: differenceInQuarters,
    calendarQuarters: differenceInCalendarQuarters,
    years: differenceInYears,
    calendarYears: differenceInCalendarYears,
    calendarISOWeekYears: differenceInCalendarISOWeekYears,
    ISOWeekYears: differenceInISOWeekYears
};

export interface GetTimeBetweenArgs {
    start?: Date | string | number;
    end?: Date | string | number;
    format: TimeBetweenFormats;
}

export function getTimeBetween(
    input: unknown,
    args: GetTimeBetweenArgs
): string | number {
    const { format, start, end } = args;

    if (start == null && end == null) {
        throw Error('Must provide a start or an end argument');
    }

    let time1;
    let time2;

    if (start) {
        time1 = start;
        time2 = input;
    }

    if (end) {
        time1 = input;
        time2 = end;
    }

    const date1 = getValidDate(time1 as Date);
    const date2 = getValidDate(time2 as Date);

    if (date1 === false || date2 === false) {
        throw Error('Could not parse date values into dates');
    }

    if (format === 'ISODuration') {
        return formatISODuration(intervalToDuration({
            start: date1,
            end: date2
        }));
    }

    return _getDurationFunc[format](date2, date1);
}

/**
 * A functional version of getTimeBetween
*/
export function getTimeBetweenFP(args: GetTimeBetweenArgs) {
    return function _getTimeBetween(input: unknown): string | number {
        return getTimeBetween(input, args);
    };
}

export function isSunday(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;

    return date.getDay() === 0;
}

export function isMonday(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;

    return date.getDay() === 1;
}

export function isTuesday(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;

    return date.getDay() === 2;
}

export function isWednesday(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;

    return date.getDay() === 3;
}

export function isThursday(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;

    return date.getDay() === 4;
}

export function isFriday(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;

    return date.getDay() === 5;
}

export function isSaturday(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;

    return date.getDay() === 6;
}

export function isWeekday(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;

    const day = date.getDay();
    return day >= 1 && day <= 5;
}

export function isWeekend(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;

    const day = date.getDay();
    return day === 0 || day === 6;
}

export function isFuture(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;
    return dateFnIsFuture(date);
}

export function isPast(input: unknown): boolean {
    const date = getValidDate(input as any);
    if (!date) return false;
    return dateFnIsPast(date);
}
