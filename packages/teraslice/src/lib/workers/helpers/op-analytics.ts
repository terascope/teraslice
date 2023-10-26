import { Logger } from '@terascope/utils';
import _ from 'lodash';
// TODO: remove lodash
function formatVal(value: string | string[]) {
    if (_.isString(value)) return `"${value}"`;
    if (_.isArray(value)) return `[${value.join(', ')}]`;

    return _.truncate(JSON.stringify(value));
}

function format(input: Record<string, any>) {
    return _.map(input, (value, key) => `${key}: ${formatVal(value)}`).join(', ');
}

// TODO: fix type here
export function logOpStats(logger: Logger, slice: any, analyticsData: any) {
    const obj = Object.assign({}, _.omit(slice, 'request'), analyticsData);

    logger.info(`analytics for slice: ${format(obj)}`);
}
