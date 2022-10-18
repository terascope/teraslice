import empty from './empty.js';
import exists from './exists.js';
import fieldGroup from './field-group.js';
import logicalGroup from './logical-group.js';
import negation from './negation.js';
import range from './range.js';
import regexp from './regexp.js';
import term from './term.js';
import wildcard from './wildcard.js';
import geo from './geo.js';

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
