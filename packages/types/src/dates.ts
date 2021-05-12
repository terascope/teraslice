/**
 * The starting substring of an ISO string that is specific towards a date interval
*/
export enum ISO8601DateSegment {
    hourly = 13,
    daily = 10,
    monthly = 7,
    yearly = 4
}

export enum TimeBetweenFormats {
    Milliseconds = 'Milliseconds',
    Seconds = 'seconds',
    Minutes = 'minutes',
    Hours = 'hours',
    Days = 'days',
    CalendarDays = 'calendarDays',
    BusinessDays = 'businessDays',
    Weeks = 'weeks',
    CalendarWeeks = 'CalendarWeeks',
    Months = 'months',
    CalendarMonths = 'calendarMonths',
    Quarters = 'quarters',
    CalendarQuarters = 'CalendarQuarters',
    Years = 'years',
    CalendarYears = 'CalendarYears',
    CalendarISOWeekYears = 'CalendarISOWeekYears',
    IsoWeekYears = 'isoWeekYears',
    IsoDuration = 'isoDuration'
}
