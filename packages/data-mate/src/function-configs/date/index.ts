import { addToDateConfig } from './addToDate';
import { isDateConfig } from './isDate';
import { isEpochConfig } from './isEpoch';
import { isEpochMillisConfig } from './isEpochMillis';
import { isISO8601Config } from './isISO8601';
import { subtractFromDateConfig } from './subtractFromDate';
import { toDailyDateConfig } from './toDailyDate';
import { toDateConfig } from './toDate';
import { toHourlyDateConfig } from './toHourlyDate';
import { toISO8601Config } from './toISO8601';
import { toMonthlyDateConfig } from './toMonthlyDate';
import { toYearlyDateConfig } from './toYearlyDate';

export const dateRepository = {
    addToDate: addToDateConfig,
    isDate: isDateConfig,
    isEpoch: isEpochConfig,
    isEpochMillis: isEpochMillisConfig,
    isISO8601: isISO8601Config,
    subtractFromDate: subtractFromDateConfig,
    toDailyDate: toDailyDateConfig,
    toDate: toDateConfig,
    toHourlyDate: toHourlyDateConfig,
    toISO8601: toISO8601Config,
    toMonthlyDate: toMonthlyDateConfig,
    toYearlyDate: toYearlyDateConfig,
};
