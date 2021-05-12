/**
 * The starting substring of an ISO string that is specific towards a date interval
*/
export enum ISO8601DateSegment {
    hourly = 13,
    daily = 10,
    monthly = 7,
    yearly = 4
}

export interface GetTimeBetweenArgs {
    start?: Date | number | string;
    end?: Date | number | string;
    format: TimeBetweenFormats;
}

export type TimeBetweenFormats = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'calendarDays' | 'businessDays' | 'weeks' | 'calendarWeeks' | 'months' | 'calendarMonths' | 'quarters' | 'calendarQuarters' | 'years' | 'calendarYears' | 'calendarISOWeekYears' | 'isoWeekYears' | 'isoDuration';
