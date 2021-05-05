import { isDateConfig } from './isDate';
import { isEpochConfig } from './isEpoch';
import { isEpochMillisConfig } from './isEpochMillis';
import { toDateConfig } from './toDate';

export const dateRepository = {
    isDate: isDateConfig,
    isEpoch: isEpochConfig,
    isEpochMillis: isEpochMillisConfig,
    toDate: toDateConfig,
};
