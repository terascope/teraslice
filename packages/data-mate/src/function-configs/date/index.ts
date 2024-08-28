import { addToDateConfig, AdjustDateArgs } from './addToDate.js';
import { formatDateConfig, FormatDateArgs } from './formatDate.js';
import { getDateConfig } from './getDate.js';
import { getHoursConfig } from './getHours.js';
import { getMillisecondsConfig } from './getMilliseconds.js';
import { getMinutesConfig } from './getMinutes.js';
import { getMonthConfig } from './getMonth.js';
import { getSecondsConfig } from './getSeconds.js';
import { getTimeBetweenConfig, GetTimeBetweenArgs } from './getTimeBetween.js';
import { getTimezoneOffsetConfig, GetTimezoneOffsetArgs } from './getTimezoneOffset.js';
import { getUTCDateConfig } from './getUTCDate.js';
import { getUTCHoursConfig } from './getUTCHours.js';
import { getUTCMinutesConfig } from './getUTCMinutes.js';
import { getUTCMonthConfig } from './getUTCMonth.js';
import { getUTCYearConfig } from './getUTCYear.js';
import { getYearConfig } from './getYear.js';
import { isAfterConfig, IsAfterArgs } from './isAfter.js';
import { isBeforeConfig, IsBeforeArgs } from './isBefore.js';
import { isBetweenConfig, IsBetweenArgs } from './isBetween.js';
import { isDateConfig, IsDateArgs } from './isDate.js';
import { isEpochConfig, IsEpochArgs } from './isEpoch.js';
import { isEpochMillisConfig, IsEpochMillisArgs } from './isEpochMillis.js';
import { isFridayConfig } from './isFriday.js';
import { isFutureConfig } from './isFuture.js';
import { isISO8601Config } from './isISO8601.js';
import { isLeapYearConfig } from './isLeapYear.js';
import { isMondayConfig } from './isMonday.js';
import { isPastConfig } from './isPast.js';
import { isSaturdayConfig } from './isSaturday.js';
import { isSundayConfig } from './isSunday.js';
import { isThursdayConfig } from './isThursday.js';
import { isTodayConfig } from './isToday.js';
import { isTomorrowConfig } from './isTomorrow.js';
import { isTuesdayConfig } from './isTuesday.js';
import { isWednesdayConfig } from './isWednesday.js';
import { isWeekdayConfig } from './isWeekday.js';
import { isWeekendConfig } from './isWeekend.js';
import { isYesterdayConfig } from './isYesterday.js';
import { lookupTimezoneConfig } from './lookupTimezone.js';
import { setDateConfig, SetDateArgs } from './setDate.js';
import { setHoursConfig, SetHoursArgs } from './setHours.js';
import { setMillisecondsConfig, SetMillisecondsArgs } from './setMilliseconds.js';
import { setMinutesConfig, SetMinutesArgs } from './setMinutes.js';
import { setMonthConfig, SetMonthArgs } from './setMonth.js';
import { setSecondsConfig, SetSecondsArgs } from './setSeconds.js';
import { setTimezoneConfig, SetTimezoneArgs } from './setTimezone.js';
import { setYearConfig, SetYearArgs } from './setYear.js';
import { subtractFromDateConfig } from './subtractFromDate.js';
import { timezoneToOffsetConfig } from './timezoneToOffset.js';
import { toDailyDateConfig } from './toDailyDate.js';
import { toDateConfig, ToDateArgs } from './toDate.js';
import { toHourlyDateConfig } from './toHourlyDate.js';
import { toMonthlyDateConfig } from './toMonthlyDate.js';
import { toTimeZoneConfig, TimeZoneArgs } from './toTimeZone.js';
import { toTimeZoneUsingLocationConfig, TimeZoneUsingLocationArgs } from './toTimeZoneUsingLocation.js';
import { toYearlyDateConfig } from './toYearlyDate.js';

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
    getUTCDate: getUTCDateConfig,
    getUTCHours: getUTCHoursConfig,
    getUTCMinutes: getUTCMinutesConfig,
    getUTCMonth: getUTCMonthConfig,
    getUTCYear: getUTCYearConfig,
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
    setTimezone: setTimezoneConfig,
    setYear: setYearConfig,
    subtractFromDate: subtractFromDateConfig,
    timezoneToOffset: timezoneToOffsetConfig,
    toDailyDate: toDailyDateConfig,
    toDate: toDateConfig,
    toHourlyDate: toHourlyDateConfig,
    toMonthlyDate: toMonthlyDateConfig,
    toTimeZone: toTimeZoneConfig,
    toTimeZoneUsingLocation: toTimeZoneUsingLocationConfig,
    toYearlyDate: toYearlyDateConfig,
};

export type {
    AdjustDateArgs,
    FormatDateArgs,
    GetTimeBetweenArgs,
    GetTimezoneOffsetArgs,
    IsAfterArgs,
    IsBeforeArgs,
    IsBetweenArgs,
    IsDateArgs,
    IsEpochArgs,
    IsEpochMillisArgs,
    SetDateArgs,
    SetHoursArgs,
    SetMillisecondsArgs,
    SetMinutesArgs,
    SetMonthArgs,
    SetSecondsArgs,
    SetTimezoneArgs,
    SetYearArgs,
    ToDateArgs,
    TimeZoneArgs,
    TimeZoneUsingLocationArgs
};
