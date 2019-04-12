import empty from './empty';
import exists from './exists';
import geo from './geo';
import field_group from './field-group';
import logical_group from './logical-group';
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
    field_group,
    logical_group,
    negation,
    geo,
};
