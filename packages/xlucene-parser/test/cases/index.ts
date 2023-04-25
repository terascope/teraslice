import empty from './empty';
import exists, { looseExists } from './exists';
import fieldGroup, { looseFieldGroup } from './field-group';
import logicalGroup, { looseLogical } from './logical-group';
import negation, { looseNegation } from './negation';
import range, { looseRange } from './range';
import regexp, { looseRegex } from './regexp';
import term, { looseTerm } from './term';
import wildcard, { looseWildcard } from './wildcard';
import geo, { looseGeo } from './geo';

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
    looseExists,
    looseFieldGroup,
    looseGeo,
    looseLogical,
    looseNegation,
    looseRange,
    looseRegex,
    looseTerm,
    looseWildcard
};
