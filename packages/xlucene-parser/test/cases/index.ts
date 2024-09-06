import empty from './empty.js';
import exists, { filterNilExists } from './exists.js';
import fieldGroup, { filterNilFieldGroup } from './field-group.js';
import logicalGroup, { filterNilLogical } from './logical-group.js';
import negation, { filterNilNegation } from './negation.js';
import range, { filterNilRange } from './range.js';
import regexp, { filterNilRegex } from './regexp.js';
import term, { filterNilTerm } from './term.js';
import wildcard, { filterNilWildcard } from './wildcard.js';
import geo, { filterNilGeo } from './geo.js';

export * from './interfaces.js';
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
