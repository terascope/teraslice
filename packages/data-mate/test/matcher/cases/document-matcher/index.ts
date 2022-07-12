import geo from './geo';
import basicQueries from './basic-terms-and-logic';
import range from './range';
import regexp from './regexp';
import ip from './ip';
import dates from './dates';
import wildcard from './wildcard';
import complexQueries from './complex-queries';
import partialVariables from './partial-variables';

export default {
    basic_queries_and_logic: basicQueries,
    range,
    dates,
    ip,
    regexp,
    wildcard,
    geo,
    complex_queries: complexQueries,
    partial_variables: partialVariables
};
