import { addToDateConfig } from './addToDate';
import { formatDateConfig } from './formatDate';
import { getTimeBetweenConfig } from './getTimeBetween';
import { isDateConfig } from './isDate';
import { isEpochConfig } from './isEpoch';
import { isEpochMillisConfig } from './isEpochMillis';
import { isFridayConfig } from './isFriday';
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
import { subtractFromDateConfig } from './subtractFromDate';
import { toDailyDateConfig } from './toDailyDate';
import { toDateConfig } from './toDate';
import { toHourlyDateConfig } from './toHourlyDate';
import { toMonthlyDateConfig } from './toMonthlyDate';
import { toYearlyDateConfig } from './toYearlyDate';

export const dateRepository = {
    addToDate: addToDateConfig,
    formatDate: formatDateConfig,
    getTimeBetween: getTimeBetweenConfig,
    isDate: isDateConfig,
    isEpoch: isEpochConfig,
    isEpochMillis: isEpochMillisConfig,
    isFriday: isFridayConfig,
    isISO8601: isISO8601Config,
    isLeapYear: isLeapYearConfig,
    isMonday: isMondayConfig,
    isPast: isPastConfig,
    isSaturday: isSaturdayConfig,
    isSunday: isSundayConfig,
    isToday: isTodayConfig,
    isTomorrow: isTomorrowConfig,
    isThursday: isThursdayConfig,
    isTuesday: isTuesdayConfig,
    isWednesday: isWednesdayConfig,
    isWeekday: isWeekdayConfig,
    isWeekend: isWeekendConfig,
    isYesterday: isYesterdayConfig,
    subtractFromDate: subtractFromDateConfig,
    toDailyDate: toDailyDateConfig,
    toDate: toDateConfig,
    toHourlyDate: toHourlyDateConfig,
    toMonthlyDate: toMonthlyDateConfig,
    toYearlyDate: toYearlyDateConfig,
};
