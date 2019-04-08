import exists from './exists';
import geo from './geo';
import fieldGroup from './field-group';
import logicGroup from './logic-group';
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
    fieldGroup,
    logicGroup,
    negation,
    geo,
};
