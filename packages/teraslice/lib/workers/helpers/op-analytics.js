'use strict';

const _ = require('lodash');

function formatVal(value) {
    if (_.isString(value)) return `"${value}"`;
    if (_.isArray(value)) return `[${value.join(', ')}]`;

    return _.truncate(JSON.stringify(value));
}

function format(input) {
    return _.map(input, (value, key) => `${key}: ${formatVal(value)}`).join(', ');
}

function logOpStats(logger, slice, analyticsData) {
    const obj = Object.assign({}, _.omit(slice, 'request'), analyticsData);

    logger.info(`analytics for slice: ${format(obj)}`);
}

module.exports = { logOpStats };
