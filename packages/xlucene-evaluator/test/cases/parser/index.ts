import exists from './exists';
import geo from './geo';
import field_group from './field-group';
import logic_group from './logic-group';
import negation from './negation';
import range from './range';
import regexp from './regexp';
import terms from './terms';
import wildcard from './wildcard';

export * from './interfaces';
export default {
    terms,
    exists,
    regexp,
    wildcard,
    range,
    field_group,
    logic_group,
    negation,
    geo,
};
