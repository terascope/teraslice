/**
 * The starting substring of an ISO string that is specific towards a date interval
*/
export enum ISO8601DateSegment {
    hourly = 'hourly',
    daily = 'daily',
    monthly = 'monthly',
    yearly = 'yearly',
}

export type TimeBetweenIntervals = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'calendarDays' | 'businessDays' | 'weeks' | 'calendarWeeks' | 'months' | 'calendarMonths' | 'quarters' | 'calendarQuarters' | 'years' | 'calendarYears' | 'calendarISOWeekYears' | 'ISOWeekYears' | 'ISO8601';

/**
 * A storage format for a date tuple, the first time is the
 * timestamp since epoch_millis and the second is the timezone offset
 * (minutes relative to UTC)
*/
export type DateTuple = readonly [epoch_millis: number, timezone: number];

export type DateTypes = Date | string | number | DateTuple;

export interface GetTimeBetweenArgs {
    start?: DateTypes;
    end?: DateTypes;
    interval: TimeBetweenIntervals;
}
