import { addToDateConfig } from './addToDate';
import { formatDateConfig } from './formatDate';
import { isDateConfig } from './isDate';
import { isEpochConfig } from './isEpoch';
import { isEpochMillisConfig } from './isEpochMillis';
import { isISO8601Config } from './isISO8601';
import { subtractFromDateConfig } from './subtractFromDate';
import { toDailyDateConfig } from './toDailyDate';
import { toDateConfig } from './toDate';
import { toHourlyDateConfig } from './toHourlyDate';
import { toMonthlyDateConfig } from './toMonthlyDate';
import { toYearlyDateConfig } from './toYearlyDate';
import { getTimeBetweenConfig } from './getTimeBetween';
import { isBeforeConfig } from './isBefore';
import { isAfterConfig } from './isAfter';
import { isBetweenConfig } from './isBetween';

export const dateRepository = {
    addToDate: addToDateConfig,
    formatDate: formatDateConfig,
    isDate: isDateConfig,
    isEpoch: isEpochConfig,
    isEpochMillis: isEpochMillisConfig,
    isISO8601: isISO8601Config,
    subtractFromDate: subtractFromDateConfig,
    toDailyDate: toDailyDateConfig,
    toDate: toDateConfig,
    toHourlyDate: toHourlyDateConfig,
    toMonthlyDate: toMonthlyDateConfig,
    toYearlyDate: toYearlyDateConfig,
    getTimeBetween: getTimeBetweenConfig,
    isAfter: isAfterConfig,
    isBefore: isBeforeConfig,
    isBetween: isBetweenConfig
};
