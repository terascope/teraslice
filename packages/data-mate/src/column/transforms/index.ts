/**
 * Everything in this file should be alphabetically ordered
 * so we can avoid merge conflicts and it is easier to find things
*/
import { castConfig } from './cast';
import { decrementConfig } from './decrement';
import { formatDateConfig } from './formatDate';
import { incrementConfig } from './increment';
import { setDefaultConfig } from './setDefault';
import { toBooleanConfig } from './toBoolean';
import { toDateConfig } from './toDate';
import { toLowerCaseConfig } from './toLowerCase';
import { toStringConfig } from './toString';
import { toUpperCaseConfig } from './toUpperCase';
import { trimConfig } from './trim';
import { trimEndConfig } from './trimEnd';
import { trimStartConfig } from './trimStart';
import { truncateConfig } from './truncate';

export const ColumnTransform = Object.freeze({
    cast: castConfig,
    decrement: decrementConfig,
    formatDate: formatDateConfig,
    increment: incrementConfig,
    setDefault: setDefaultConfig,
    toBoolean: toBooleanConfig,
    toDate: toDateConfig,
    toLowerCase: toLowerCaseConfig,
    toString: toStringConfig,
    toUpperCase: toUpperCaseConfig,
    trim: trimConfig,
    trimEnd: trimEndConfig,
    trimStart: trimStartConfig,
    truncate: truncateConfig,
});
