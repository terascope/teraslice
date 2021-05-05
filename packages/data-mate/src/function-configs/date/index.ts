import { isDateConfig } from './isDate';
import { isEpochConfig } from './isEpoch';
import { isEpochMillisConfig } from './isEpochMillis';
import { isISO8601Config } from './isISO8061';
import { toDateConfig } from './toDate';
import { toISO8061Config } from './toISO8061';

export const dateRepository = {
    isDate: isDateConfig,
    isEpoch: isEpochConfig,
    isEpochMillis: isEpochMillisConfig,
    isISO8061: isISO8601Config,
    toDate: toDateConfig,
    toISO8061: toISO8061Config
};
