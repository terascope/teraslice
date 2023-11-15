import {
    Logger, isString, isArray,
    truncate,
} from '@terascope/utils';

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
export function logOpStats(logger: Logger, slice: Record<string, any>, analyticsData: any) {
    const { request, ...record } = slice;
    const obj = Object.assign({}, record, analyticsData);
    console.dir({ slice, obj, logOpStats: true }, { depth: 40 })

    logger.info(`analytics for slice: ${format(obj)}`);
}
