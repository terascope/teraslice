/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable no-param-reassign */

import { toString } from './strings.js';

type ArgType<T> = T extends (...args: infer A) => any ? A : any;

/**
 * Creates a function that is only invoked once
*/
export function once<T extends((...args: any[]) => any)>(fn: T): (
    ...args: ArgType<T>
) => ReturnType<T> | undefined {
    let called = false;
    return function _fn(...args: ArgType<T>): ReturnType<T> | undefined {
        if (called) {
            fn = undefined as any;
            return undefined;
        }
        called = true;
        return fn(...args);
    };
}

/**
 * A simple function that does nothing but return the first
 * argument
*/
export function noop(...args: any[]): any {
    return args[0];
}

function _getArgCacheKey(args: any[]): string {
    const fixed = args.filter((a, i, arr) => {
        if (a === undefined && arr.length === (i + 1)) return false;
        return true;
    });
    try {
        return JSON.stringify(fixed);
    } catch (_e) {
        return toString(fixed);
    }
}

type MemoizeFn = (...args: any[]) => any;
/**
 * A replacement for lodash memoize
*/
export function memoize<T extends MemoizeFn>(fn: T): T {
    const _cache = new Map<string, any>();

    const _memoize: any = (...args: any[]): any => {
        const key = _getArgCacheKey(args);
        const cached = _cache.get(key);
        if (cached !== undefined) return cached;
        const result = fn(...args);
        _cache.set(key, result);
        return result;
    };
    return _memoize;
}

/** Verify an input is a function */
export function isFunction(input: unknown): input is Function {
    return !!(input && typeof input === 'function');
}
