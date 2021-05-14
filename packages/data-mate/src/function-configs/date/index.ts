import { addToDateConfig } from './addToDate';
import { formatDateConfig } from './formatDate';
import { isDateConfig } from './isDate';
import { isEpochConfig } from './isEpoch';
import { isEpochMillisConfig } from './isEpochMillis';
import { isFridayConfig } from './isFriday';
import { isISO8601Config } from './isISO8601';
import { isMondayConfig } from './isMonday';
import { isSaturdayConfig } from './isSaturday';
import { isSundayConfig } from './isSunday';
import { isThursdayConfig } from './isThursday';
import { isTuesdayConfig } from './isTuesday';
import { isWednesdayConfig } from './isWednesday';
import { subtractFromDateConfig } from './subtractFromDate';
import { toDailyDateConfig } from './toDailyDate';
import { toDateConfig } from './toDate';
import { toHourlyDateConfig } from './toHourlyDate';
import { toMonthlyDateConfig } from './toMonthlyDate';
import { toYearlyDateConfig } from './toYearlyDate';
import { getTimeBetweenConfig } from './getTimeBetween';

export const dateRepository = {
    addToDate: addToDateConfig,
    formatDate: formatDateConfig,
    isDate: isDateConfig,
    isEpoch: isEpochConfig,
    isEpochMillis: isEpochMillisConfig,
    isFriday: isFridayConfig,
    isISO8601: isISO8601Config,
    isMonday: isMondayConfig,
    isSaturday: isSaturdayConfig,
    isSunday: isSundayConfig,
    isThursday: isThursdayConfig,
    isTuesday: isTuesdayConfig,
    isWednesday: isWednesdayConfig,
    subtractFromDate: subtractFromDateConfig,
    toDailyDate: toDailyDateConfig,
    toDate: toDateConfig,
    toHourlyDate: toHourlyDateConfig,
    toMonthlyDate: toMonthlyDateConfig,
    toYearlyDate: toYearlyDateConfig,
    getTimeBetween: getTimeBetweenConfig
};
