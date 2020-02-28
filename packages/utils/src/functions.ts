import { toString } from './strings';

type ArgType<T> = T extends (...args: infer A) => any ? A : any;

/**
 * Creates a function that is only invoked once
*/
export function once<T extends((...args: any[]) => any)>(fn: T) {
    let called = false;
    function _fn(...args: ArgType<T>): ReturnType<T>|undefined {
        if (called) return undefined;
        called = true;
        return fn(...args);
    }
    return _fn;
}

export function noop(..._args: any[]): any {}

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
