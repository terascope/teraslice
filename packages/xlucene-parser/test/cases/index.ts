import empty from './empty';
import exists from './exists';
import fieldGroup, { looseFieldGroup } from './field-group';
import logicalGroup from './logical-group';
import negation from './negation';
import range, { looseRange } from './range';
import regexp from './regexp';
import term, { looseTerm } from './term';
import wildcard from './wildcard';
import geo from './geo';

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

export const looseTestCases = {
    empty,
    exists,
    looseFieldGroup,
    // geo,
    // logical
    // negation
    looseRange,
    // regexp
    looseTerm,
    // wildcard - maybe add a wildcard to field or logical group
};
