import empty from './empty';
import exists, { filterNilExists } from './exists';
import fieldGroup, { filterNilFieldGroup } from './field-group';
import logicalGroup, { filterNilLogical } from './logical-group';
import negation, { filterNilNegation } from './negation';
import range, { filterNilRange } from './range';
import regexp, { filterNilRegex } from './regexp';
import term, { filterNilTerm } from './term';
import wildcard, { filterNilWildcard } from './wildcard';
import geo, { filterNilGeo } from './geo';
import { relativeDateRangeFailures } from './range-relative-dates';

export * from './interfaces';
export default {
    empty,
    term,
    exists,
    regexp,
    wildcard,
    range,
    field_group: fieldGroup,
    logical_group: logicalGroup,
    negation,
    geo,
};

/** filtering out nodes with undefined variables */
export const filterNilTestCases = {
    empty,
    filterNilExists,
    filterNilFieldGroup,
    filterNilGeo,
    filterNilLogical,
    filterNilNegation,
    filterNilRange,
    filterNilRegex,
    filterNilTerm,
    filterNilWildcard
};

export const failures = [
    ...relativeDateRangeFailures
];
