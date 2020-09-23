import { formatDateConfig } from './formatDate';
import { toBooleanConfig } from './toBoolean';
import { toLowerCaseConfig } from './toLowerCase';
import { toStringConfig } from './toString';
import { toUpperCaseConfig } from './toUpperCase';

export const ColumnTransform = Object.freeze({
    formatDate: formatDateConfig,
    toBoolean: toBooleanConfig,
    toLowerCase: toLowerCaseConfig,
    toString: toStringConfig,
    toUpperCase: toUpperCaseConfig,
});
