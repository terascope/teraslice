/**
 * The starting substring of an ISO string that is specific towards a date interval
*/
export enum ISO8601DateSegment {
    hourly = 'hourly',
    daily = 'daily',
    monthly = 'monthly',
    yearly = 'yearly',
}

export type TimeBetweenFormats = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'calendarDays' | 'businessDays' | 'weeks' | 'calendarWeeks' | 'months' | 'calendarMonths' | 'quarters' | 'calendarQuarters' | 'years' | 'calendarYears' | 'calendarISOWeekYears' | 'ISOWeekYears' | 'ISODuration';
