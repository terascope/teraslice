/**
 * Everything in this file should be alphabetically ordered
 * so we can avoid merge conflicts and it is easier to find things
*/
import { formatDateConfig } from './formatDate';
import { toBooleanConfig } from './toBoolean';
import { toDateConfig } from './toDate';
import { toLowerCaseConfig } from './toLowerCase';
import { toStringConfig } from './toString';
import { toUpperCaseConfig } from './toUpperCase';

export const ColumnTransform = Object.freeze({
    formatDate: formatDateConfig,
    toBoolean: toBooleanConfig,
    toDate: toDateConfig,
    toLowerCase: toLowerCaseConfig,
    toString: toStringConfig,
    toUpperCase: toUpperCaseConfig,
});
