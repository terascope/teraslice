import validator from 'validator';
import parser from 'datemath-parser';
import parseDate from 'date-fns/parse';
import formatDate from 'date-fns/lightFormat';
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import differenceInHours from 'date-fns/differenceInHours';
import differenceInDays from 'date-fns/differenceInDays';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import differenceInBusinessDays from 'date-fns/differenceInBusinessDays';
import differenceInWeeks from 'date-fns/differenceInWeeks';
import differenceInCalendarISOWeeks from 'date-fns/differenceInCalendarISOWeeks';
import differenceInCalendarISOWeekYears from 'date-fns/differenceInCalendarISOWeekYears';
import differenceInMonths from 'date-fns/differenceInMonths';
import differenceInCalendarMonths from 'date-fns/differenceInCalendarMonths';
import differenceInQuarters from 'date-fns/differenceInQuarters';
import differenceInCalendarQuarters from 'date-fns/differenceInCalendarQuarters';
import differenceInYears from 'date-fns/differenceInYears';
import differenceInCalendarYears from 'date-fns/differenceInCalendarYears';
import differenceInISOWeekYears from 'date-fns/differenceInISOWeekYears';
import intervalToDuration from 'date-fns/intervalToDuration';
import formatISODuration from 'date-fns/formatISODuration';
import _isFuture from 'date-fns/isFuture';
import _isPast from 'date-fns/isPast';
import _isLeapYear from 'date-fns/isLeapYear';
import _isToday from 'date-fns/isToday';
import _isTomorrow from 'date-fns/isTomorrow';
import _isYesterday from 'date-fns/isYesterday';
import add from 'date-fns/add';
import sub from 'date-fns/sub';
import _isBefore from 'date-fns/isBefore';
import _isAfter from 'date-fns/isAfter';
import {
    DateFormat,
    ISO8601DateSegment,
    DateTuple,
    DateInputTypes,
    GetTimeBetweenArgs
} from '@terascope/types';
import tzOffset from 'date-fns-tz/getTimezoneOffset';
import { getTypeOf } from './deps';
import {
    bigIntToJSON, isNumber, toInteger, isInteger, inNumberRange
} from './numbers';
import { isString } from './strings';
import { isBoolean } from './booleans';

// date-fns doesn't handle utc correctly here
// https://github.com/date-fns/date-fns/issues/376
// https://github.com/date-fns/date-fns/blob/d0efa9eae1cf05c0e27461296b537b9dd46283d4/src/format/index.js#L399-L403
export const timezoneOffset = new Date().getTimezoneOffset() * 60_000;

/**
 * A helper function for making an ISODate string
 */
export function makeISODate(value?: Date|number|string|null|undefined|DateTuple): string {
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
    if (val == null || isBoolean(val)) return false;
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

    if (typeof val === 'number') {
        if (!Number.isInteger(val)) return false;
        return new Date(val);
    }

    if (isDateTuple(val)) return new Date(val[0]);

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
 * @returns date object from date tuple
 */

function _dateTupleToDateObject(val: DateTuple): Date {
    return new Date(val[0] - (val[1] * 60_000));
}

/**
 * Returns a valid date with the timezone applied or throws{@see getValidDate}
 */
export function getValidDateWithTimezoneOrThrow(val: unknown): Date {
    if (isDateTuple(val)) {
        return _dateTupleToDateObject(val);
    }

    return getValidDateOrThrow(val);
}

/**
 * Returns a valid date with the timezone applied {@see getValidDate}
 */
export function getValidDateWithTimezone(val: unknown): Date | false {
    if (isDateTuple(val)) {
        return _dateTupleToDateObject(val);
    }

    return getValidDate(val);
}

/**
 * Returns a valid date or throws, {@see getValidDate}
*/
export function getValidDateOrNumberOrThrow(val: unknown): Date|number {
    if (typeof val === 'number' && !Number.isInteger(val)) return val;
    if (isDateTuple(val)) return val[0];

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
export function getTime(val?: DateInputTypes): number | false {
    if (val == null) return Date.now();
    const result = getValidDate(val);
    if (result === false) return false;
    return result.getTime();
}

export function getUnixTime(val?: DateInputTypes): number | false {
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
export function toISO8601(value: unknown): string {
    if (isNumber(value)) {
        return new Date(value).toISOString();
    }

    if (isDateTuple(value)) {
        // this is utc so just fall back to
        // to the correct timezone
        if (value[1] === 0) {
            return new Date(value[0]).toISOString();
        }
        return new Date(value[0]).toISOString().replace('Z', _genISOTimezone(value[1]));
    }

    return makeISODate(value as any);
}

/**
 * Generate the ISO8601
*/
function _genISOTimezone(offset: number): string {
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset - (hours * 60);

    const sign = offset < 0 ? '-' : '+';
    return `${sign}${_padNum(hours)}:${_padNum(minutes)}`;
}

/**
 * a simple version of pad that only deals with simple cases
*/
function _padNum(input: number): string {
    return input < 10 ? `0${input}` : `${input}`;
}

/**
 * Set the timezone offset of a date, returns a date tuple
 */
export function setTimezone(input: unknown, timezone: string|number): DateTuple {
    const validTZ: number = isNumber(timezone) ? timezone : timezoneToOffset(timezone);
    return _makeDateTuple(input, validTZ);
}

/**
 * A curried version of setTimezone
*/
export function setTimezoneFP(timezone: string|number): (input: unknown) => DateTuple {
    const validTZ: number = isNumber(timezone) ? timezone : timezoneToOffset(timezone);

    return function _setTimezone(input: unknown): DateTuple {
        return _makeDateTuple(input, validTZ);
    };
}

function _makeDateTuple(input: unknown, offset: number): DateTuple {
    if (isNumber(input)) return [input, offset];
    if (isDateTuple(input)) return [input[0], offset];

    const date = getValidDateOrThrow(input);
    return [date.getTime(), offset];
}

/**
 * Verify if an input is a Date Tuple
*/
export function isDateTuple(input: unknown): input is DateTuple {
    return Array.isArray(input)
        && input.length === 2
        && Number.isInteger(input[0])
        && Number.isInteger(input[1])
        // the timezone has to be within 24hours
        // in minutes
        && input[1] <= 1440
        && input[1] >= -1440;
}

/**
 * Returns a function to trim the ISO 8601 date segment
 * useful for creating yearly, monthly, daily or hourly dates
*/
export function trimISODateSegment(segment: ISO8601DateSegment): (input: unknown) => number {
    return function _trimISODate(input) {
        const date = getValidDateWithTimezoneOrThrow(input);

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
    value: Date|number|DateTuple,
    format: DateFormat|string|undefined,
): string|number {
    const inMs = _toMilliseconds(value);

    if (format === DateFormat.epoch_millis || format === DateFormat.milliseconds) {
        return inMs;
    }

    if (format === DateFormat.epoch || format === DateFormat.seconds) {
        return Math.floor(inMs / 1000);
    }

    if (format && !(format in DateFormat)) {
        // need add our offset here to
        // deal with UTC time
        return formatDate(inMs + timezoneOffset, format);
    }

    return toISO8601(value);
}

function _toMilliseconds(value: Date | number | DateTuple): number {
    if (isDateTuple(value)) return value[0];

    return value instanceof Date ? value.getTime() : value;
}

export const getDurationFunc = {
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

export function getTimeBetween(
    input: unknown,
    args: GetTimeBetweenArgs
): string | number {
    const { interval } = args;

    const [time1, time2] = _getStartEndTime(input, args);

    const date1 = getValidDateWithTimezoneOrThrow(time1);
    const date2 = getValidDateWithTimezoneOrThrow(time2);

    if (interval === 'ISO8601') {
        return formatISODuration(intervalToDuration({
            start: date1,
            end: date2
        }));
    }

    return getDurationFunc[interval](date2, date1);
}

function _getStartEndTime(
    input: unknown, args: GetTimeBetweenArgs
): [DateInputTypes, DateInputTypes] {
    const { start, end } = args;

    if (start == null && end == null) {
        throw Error('Must provide a start or an end argument');
    }

    if (start) return [start, input as DateInputTypes];

    return [input as DateInputTypes, end as DateInputTypes];
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
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return date.getDay() === 0;
}

export function isMonday(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return date.getDay() === 1;
}

export function isTuesday(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return date.getDay() === 2;
}

export function isWednesday(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return date.getDay() === 3;
}

export function isThursday(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return date.getDay() === 4;
}

export function isFriday(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return date.getDay() === 5;
}

export function isSaturday(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return date.getDay() === 6;
}

export function isWeekday(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    const day = date.getDay();
    return day >= 1 && day <= 5;
}

export function isWeekend(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    const day = date.getDay();
    return day === 0 || day === 6;
}

export function isFuture(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return _isFuture(date);
}

export function isPast(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return _isPast(date);
}

export function isLeapYear(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return _isLeapYear(date);
}

export function isTomorrow(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return _isTomorrow(date);
}

export function isToday(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return _isToday(date);
}

export function isYesterday(input: unknown): boolean {
    const date = getValidDateWithTimezone(input as any);
    if (!date) return false;

    return _isYesterday(date);
}

export type AdjustDateArgs = {
    readonly expr: string;
}|{
    readonly years?: number;
    readonly months?: number;
    readonly weeks?: number;
    readonly days?: number;
    readonly hours?: number;
    readonly minutes?: number;
    readonly seconds?: number;
    readonly milliseconds?: number;
}

export function addToDate(input: unknown, args: AdjustDateArgs): number {
    const date = getValidDateWithTimezoneOrThrow(input);

    if ('expr' in args) {
        return parser.parse(`now+${args.expr}`, date);
    }

    return add(date, args).getTime();
}

export function addToDateFP(args: AdjustDateArgs): (input: unknown) => number {
    return function _addToDateFP(input: unknown): number {
        return addToDate(input, args);
    };
}

export function subtractFromDate(input: unknown, args: AdjustDateArgs): number {
    const date = getValidDateWithTimezoneOrThrow(input);

    if ('expr' in args) {
        return parser.parse(`now-${args.expr}`, date);
    }

    return sub(date, args).getTime();
}

export function subtractFromDateFP(args: AdjustDateArgs): (input: unknown) => number {
    return function _subtractFromDateFP(input: unknown): number {
        return subtractFromDate(input, args);
    };
}

export function isBefore(input: unknown, date: DateInputTypes): boolean {
    const date1 = getValidDateWithTimezone(input as Date);
    const date2 = getValidDateWithTimezone(date);

    if (date1 && date2) {
        return _isBefore(date1, date2);
    }

    return false;
}

export function isAfter(input: unknown, date: DateInputTypes): boolean {
    const date1 = getValidDateWithTimezone(input as Date);
    const date2 = getValidDateWithTimezone(date);

    if (date1 && date2) {
        return _isAfter(date1, date2);
    }

    return false;
}

export function isBetween(input: unknown, args: {
    start: DateInputTypes;
    end: DateInputTypes;
}): boolean {
    const { start, end } = args;

    const inputDate = getValidDateWithTimezone(input);
    const date1 = getValidDateWithTimezone(start);
    const date2 = getValidDateWithTimezone(end);

    if (inputDate && date1 && date2) {
        return _isAfter(inputDate, date1) && _isBefore(inputDate, date2);
    }

    return false;
}

/** Given a timezone, it will return the minutes of its offset from UTC time */
export function timezoneToOffset(timezone: unknown): number {
    if (!isString(timezone)) {
        throw new Error(`Invalid argument timezone, it must be a string, got ${getTypeOf(timezone)}`);
    }

    return Math.round(tzOffset(timezone) / (1000 * 60));
}

/** Given a date and timezone, it will return the offset from UTC in minutes.
 *  This is more accurate than timezoneToOffset as it can better account for day lights saving time
 * */
export function getTimezoneOffset(input: unknown, timezone: string): number {
    const date = getValidDateOrThrow(input);

    if (!isString(timezone)) {
        throw new Error(`Invalid argument timezone, it must be a string, got ${getTypeOf(timezone)}`);
    }

    return Math.round(tzOffset(timezone, date) / (1000 * 60));
}

/** Given a timezone, it will return a function that will take in dates that will
 * be converted the offset in minutes. This is more accurate than timezoneToOffset
 * as it can better account for day lights saving time
 * */
export function getTimezoneOffsetFP(timezone: string): (input: unknown) => number {
    if (!isString(timezone)) {
        throw new Error(`Invalid argument timezone, it must be a string, got ${getTypeOf(timezone)}`);
    }

    return function _getTimezoneOffsetFP(input: unknown) {
        const date = getValidDateOrThrow(input);
        return Math.round(tzOffset(timezone, date) / (1000 * 60));
    };
}

export function setMilliseconds(ms: number): (input: unknown) => number {
    if (!isInteger(ms) || !inNumberRange(ms, { min: 0, max: 999, inclusive: true })) {
        throw Error(`milliseconds value must be an integer between 0 and 999, received ${ms}`);
    }

    return function _setMilliseconds(input) {
        const inputDate = getValidDateOrThrow(input as any);
        return inputDate.setUTCMilliseconds(ms);
    };
}

export function setSeconds(seconds: number): (input: unknown) => number {
    if (!isInteger(seconds) || !inNumberRange(seconds, { min: 0, max: 59, inclusive: true })) {
        throw Error(`seconds value must be an integer between 0 and 59, received ${seconds}`);
    }

    return function _setSeconds(input: unknown) {
        const inputDate = getValidDateOrThrow(input as any);
        return inputDate.setUTCSeconds(seconds);
    };
}

export function setMinutes(minutes: number): (input: unknown) => number {
    if (!isInteger(minutes) || !inNumberRange(minutes, { min: 0, max: 59, inclusive: true })) {
        throw Error(`minutes value must be an integer between 0 and 59, received ${minutes}`);
    }

    return function _setMinutes(input: unknown) {
        const inputDate = getValidDateWithTimezoneOrThrow(input as any);
        return inputDate.setUTCMinutes(minutes);
    };
}

export function setHours(hours: number):(input: unknown) => number {
    if (!isInteger(hours) || !inNumberRange(hours, { min: 0, max: 23, inclusive: true })) {
        throw Error(`hours value must be an integer between 0 and 23, received ${hours}`);
    }

    return function _setHours(input: unknown) {
        const inputDate = getValidDateWithTimezoneOrThrow(input as any);
        return inputDate.setUTCHours(hours);
    };
}

export function setDate(date: number): (input: unknown) => number {
    if (!isInteger(date) || !inNumberRange(date, { min: 1, max: 31, inclusive: true })) {
        throw Error(`date value must be an integer between 1 and 31, received ${date}`);
    }

    return function _setDate(input: unknown) {
        const inputDate = getValidDateWithTimezoneOrThrow(input as any);
        return inputDate.setUTCDate(date);
    };
}

export function setMonth(month: number): (input: unknown) => number {
    if (!isInteger(month) || !inNumberRange(month, { min: 1, max: 12, inclusive: true })) {
        throw Error(`month value must be an integer between 1 and 12, received ${month}`);
    }

    return function _setMonth(input: unknown) {
        const inputDate = getValidDateWithTimezoneOrThrow(input as any);
        return inputDate.setUTCMonth(month - 1);
    };
}

export function setYear(year: number): (input: unknown) => number {
    if (!isInteger(year)) {
        throw Error(`year value must be an integer, received ${year}`);
    }

    return function _setYear(input: unknown) {
        const inputDate = getValidDateWithTimezoneOrThrow(input as any);
        return inputDate.setUTCFullYear(year);
    };
}

export function getMilliseconds(input: unknown): number {
    return getValidDateOrThrow(input as any).getUTCMilliseconds();
}

export function getSeconds(input: unknown): number {
    return getValidDateOrThrow(input as any).getUTCSeconds();
}

export function getMinutes(input: unknown): number {
    return getValidDateWithTimezoneOrThrow(input).getUTCMinutes();
}

export function getHours(input: unknown): number {
    return getValidDateWithTimezoneOrThrow(input).getUTCHours();
}

export function getDate(input: unknown): number {
    return getValidDateWithTimezoneOrThrow(input).getUTCDate();
}

export function getMonth(input: unknown): number {
    return getValidDateWithTimezoneOrThrow(input).getUTCMonth() + 1;
}

export function getYear(input: unknown): number {
    return getValidDateWithTimezoneOrThrow(input).getUTCFullYear();
}

/** Will convert a date to its epoch millisecond format or throw if invalid  */
export function toEpochMSOrThrow(input: unknown): DateTuple|number {
    if (isDateTuple(input)) return input;

    const epochMillis = getTime(input as any);

    if (epochMillis === false) {
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be a standard date value`);
    }

    return epochMillis;
}
