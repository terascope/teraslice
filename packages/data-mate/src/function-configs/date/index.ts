import { addToDateConfig } from './addToDate';
import { formatDateConfig } from './formatDate';
import { getDateConfig } from './getDate';
import { getHoursConfig } from './getHours';
import { getMillisecondsConfig } from './getMilliseconds';
import { getMinutesConfig } from './getMinutes';
import { getMonthConfig } from './getMonth';
import { getSecondsConfig } from './getSeconds';
import { getTimeBetweenConfig } from './getTimeBetween';
import { getTimezoneOffsetConfig } from './getTimezoneOffset';
import { getYearConfig } from './getYear';
import { isAfterConfig } from './isAfter';
import { isBeforeConfig } from './isBefore';
import { isBetweenConfig } from './isBetween';
import { isDateConfig } from './isDate';
import { isEpochConfig } from './isEpoch';
import { isEpochMillisConfig } from './isEpochMillis';
import { isFridayConfig } from './isFriday';
import { isFutureConfig } from './isFuture';
import { isISO8601Config } from './isISO8601';
import { isLeapYearConfig } from './isLeapYear';
import { isMondayConfig } from './isMonday';
import { isPastConfig } from './isPast';
import { isSaturdayConfig } from './isSaturday';
import { isSundayConfig } from './isSunday';
import { isThursdayConfig } from './isThursday';
import { isTodayConfig } from './isToday';
import { isTomorrowConfig } from './isTomorrow';
import { isTuesdayConfig } from './isTuesday';
import { isWednesdayConfig } from './isWednesday';
import { isWeekdayConfig } from './isWeekday';
import { isWeekendConfig } from './isWeekend';
import { isYesterdayConfig } from './isYesterday';
import { lookupTimezoneConfig } from './lookupTimezone';
import { subtractFromDateConfig } from './subtractFromDate';
import { setMillisecondsConfig } from './setMilliseconds';
import { setSecondsConfig } from './setSeconds';
import { setMinutesConfig } from './setMinutes';
import { setHoursConfig } from './setHours';
import { setDateConfig } from './setDate';
import { setMonthConfig } from './setMonth';
import { setYearConfig } from './setYear';
import { timezoneToOffsetConfig } from './timezoneToOffset';
import { toDailyDateConfig } from './toDailyDate';
import { toDateConfig } from './toDate';
import { toHourlyDateConfig } from './toHourlyDate';
import { toMonthlyDateConfig } from './toMonthlyDate';
import { toYearlyDateConfig } from './toYearlyDate';

export const dateRepository = {
    addToDate: addToDateConfig,
    formatDate: formatDateConfig,
    getDate: getDateConfig,
    getHours: getHoursConfig,
    getMilliseconds: getMillisecondsConfig,
    getMinutes: getMinutesConfig,
    getMonth: getMonthConfig,
    getSeconds: getSecondsConfig,
    getTimeBetween: getTimeBetweenConfig,
    getTimezoneOffset: getTimezoneOffsetConfig,
    getYear: getYearConfig,
    isAfter: isAfterConfig,
    isBefore: isBeforeConfig,
    isBetween: isBetweenConfig,
    isDate: isDateConfig,
    isEpoch: isEpochConfig,
    isEpochMillis: isEpochMillisConfig,
    isFriday: isFridayConfig,
    isFuture: isFutureConfig,
    isISO8601: isISO8601Config,
    isLeapYear: isLeapYearConfig,
    isMonday: isMondayConfig,
    isPast: isPastConfig,
    isSaturday: isSaturdayConfig,
    isSunday: isSundayConfig,
    isThursday: isThursdayConfig,
    isToday: isTodayConfig,
    isTomorrow: isTomorrowConfig,
    isTuesday: isTuesdayConfig,
    isWednesday: isWednesdayConfig,
    isWeekday: isWeekdayConfig,
    isWeekend: isWeekendConfig,
    isYesterday: isYesterdayConfig,
    lookupTimezone: lookupTimezoneConfig,
    setDate: setDateConfig,
    setHours: setHoursConfig,
    setMilliseconds: setMillisecondsConfig,
    setMinutes: setMinutesConfig,
    setMonth: setMonthConfig,
    setSeconds: setSecondsConfig,
    setYear: setYearConfig,
    subtractFromDate: subtractFromDateConfig,
    timezoneToOffset: timezoneToOffsetConfig,
    toDailyDate: toDailyDateConfig,
    toDate: toDateConfig,
    toHourlyDate: toHourlyDateConfig,
    toMonthlyDate: toMonthlyDateConfig,
    toYearlyDate: toYearlyDateConfig,
};
