import _ from 'lodash-es;

function formatVal(value) {
    if (_.isString(value)) return `"${value}"`;
    if (_.isArray(value)) return `[${value.join(', ')}]`;

    return _.truncate(JSON.stringify(value));
}

function format(input) {
    return _.map(input, (value, key) => `${key}: ${formatVal(value)}`).join(', ');
}

export function logOpStats(logger, slice, analyticsData) {
    const obj = Object.assign({}, _.omit(slice, 'request'), analyticsData);

    logger.info(`analytics for slice: ${format(obj)}`);
}
