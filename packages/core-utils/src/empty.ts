import { Nil } from '@terascope/types';
import { isAsyncIterator, isIterator } from './iterators.js';

export function isNil<T>(input: T | Nil): input is Nil {
    return input == null;
}

export function isNotNil<T>(input: T | Nil): boolean {
    return input != null;
}

/**
 * Check if an input is empty, similar to lodash.isEmpty -
 *
 * NOTE - NUMBERS & BOOLEANS are always empty as this is
 * for iterable things strings, arrays, objects, etc.
*/
export function isEmpty<T>(val?: T | null | undefined): val is undefined {
    const _val = val as any;
    if (!_val) return true;
    if (typeof _val.size === 'number') return !_val.size;
    if (typeof _val.length === 'number') return !_val.length;
    if (_val instanceof Error) return !_val.message.length;
    if (Buffer.isBuffer(_val)) return !_val.length;
    if (isIterator(val) || isAsyncIterator(val)) return false;
    if (typeof val === 'object') return !Object.keys(_val).length;

    return true;
}
