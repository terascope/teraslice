import empty from './empty';
import exists from './exists';
import geo from './geo';
import fieldGroup from './field-group';
import logicalGroup from './logical-group';
import negation from './negation';
import range from './range';
import regexp from './regexp';
import terms from './terms';
import wildcard from './wildcard';

export * from './interfaces';
export default {
    empty,
    terms,
    exists,
    regexp,
    wildcard,
    range,
    field_group: fieldGroup,
    logical_group: logicalGroup,
    negation,
    geo,
};
