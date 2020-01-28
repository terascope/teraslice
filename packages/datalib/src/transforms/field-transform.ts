import * as ts from '@terascope/utils';
import { Repository } from '../interfaces';

export const respoitory: Repository = {
    uppercase: { fn: uppercase, config: {} },
    truncate: { fn: truncate, config: { size: { type: 'Int!' } } },
    toBoolean: { fn: toBoolean, config: {} },
};

export function toBoolean(input: string) {
    return ts.toBoolean(input);
}

export function uppercase(input: string) {
    if (ts.isString(input)) return input.toUpperCase();
    return null;
}

export function truncate(input: string, args: ts.AnyObject) {
    const { size } = args;
    // should we be throwing
    if (!size || !ts.isNumber(size) || size <= 0) throw new Error('Invalid size paramter for truncate');
    if (ts.isString(input)) return input.slice(0, size);
    return null;
}
