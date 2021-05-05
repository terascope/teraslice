import { isDateConfig } from './isDate';
import { isEpochConfig } from './isEpoch';
import { isEpochMillisConfig } from './isEpochMillis';
import { isISO8601Config } from './isISO8061';
import { toDateConfig } from './toDate';

export const dateRepository = {
    isDate: isDateConfig,
    isEpoch: isEpochConfig,
    isEpochMillis: isEpochMillisConfig,
    isISO8061: isISO8601Config,
    toDate: toDateConfig,
};
