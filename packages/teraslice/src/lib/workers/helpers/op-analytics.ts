import {
    Logger, isString, isArray,
    truncate,
} from '@terascope/core-utils';
import type { Slice } from '@terascope/types';

function formatVal(value: string | string[]) {
    if (isString(value)) return `"${value}"`;
    if (isArray(value)) return `[${value.join(', ')}]`;

    return truncate(JSON.stringify(value), 30);
}

function format(input: Record<string, any>) {
    const list: string[] = [];

    for (const [key, value] of Object.entries(input)) {
        list.push(`${key}: ${formatVal(value)}`);
    }

    return list.join(', ');
}

// TODO: fix type here
export function logOpStats(logger: Logger, slice: Slice, analyticsData: any) {
    const { request, ...record } = slice;
    const obj = Object.assign({}, record, analyticsData);
    logger.info(`analytics for slice: ${format(obj)}`);
}
