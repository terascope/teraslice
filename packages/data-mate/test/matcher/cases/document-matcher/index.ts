import geo from './geo.js';
import basicQueries from './basic-terms-and-logic.js';
import range from './range.js';
import regexp from './regexp.js';
import ip from './ip.js';
import dates from './dates.js';
import wildcard from './wildcard.js';
import complexQueries from './complex-queries.js';
import partialVariables from './partial-variables.js';

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
