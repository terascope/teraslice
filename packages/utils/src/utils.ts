import get from 'lodash.get';
import kindOf from 'kind-of';
import {
    isString,
    toString,
    firstToUpper,
    trimAndToLower
} from './strings';

/** Check if an input is empty, similar to lodash.isEmpty */
export function isEmpty<T>(val?: T): val is undefined {
    const _val = val as any;
    if (!_val) return true;
    if (typeof _val.size === 'number') return !_val.size;
    if (typeof _val.length === 'number') return !_val.length;
    if (typeof val === 'object') return !Object.keys(_val).length;

    return true;
}

export function tryParseJSON(input: any) {
    try {
        return JSON.parse(input);
    } catch (err) {
        return input;
    }
}

/** JSON encoded buffer into a json object */
export function parseJSON<T = object>(buf: Buffer | string): T {
    if (!Buffer.isBuffer(buf) && !isString(buf)) {
        throw new TypeError(`Failure to serialize non-buffer, got "${getTypeOf(buf)}"`);
    }

    try {
        // @ts-ignore because it does work with buffers
        return JSON.parse(buf);
    } catch (err) {
        throw new Error(`Failure to parse buffer, ${toString(err)}`);
    }
}

/**
 * Determine the type of an input
 * @return a human friendly string that describes the input
 */
export function getTypeOf(val: any): string {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';

    if (typeof val === 'object') {
        if (val.__isDataEntity) return 'DataEntity';
        if (val.constructor && val.constructor.name) {
            return val.constructor.name;
        }
        if (val.prototype && val.prototype.name) {
            return val.prototype.name;
        }
    }

    const kind = kindOf(val);
    return firstToUpper(kind);
}

/** Verify an input is a function */
export function isFunction(input: any): input is Function {
    return !!(input && typeof input === 'function');
}

/** Convert any input into a boolean, this will work with stringified boolean */
export function toBoolean(input: any): boolean {
    const val: any = isString(input) ? trimAndToLower(input) : input;
    const thruthy = [1, '1', true, 'true', 'yes'];
    return thruthy.includes(val);
}

export function isBuffer(input: any): input is Buffer {
    return input != null && Buffer.isBuffer(input);
}

export function ensureBuffer(input: string|Buffer, encoding: BufferEncoding = 'utf8'): Buffer {
    if (isString(input)) {
        return Buffer.from(input, encoding);
    }
    if (Buffer.isBuffer(input)) {
        return input;
    }
    throw new Error(`Invalid input given, expected string or buffer, got ${getTypeOf(input)}`);
}

export function isBoolean(input: any): input is boolean {
    if (typeof input === 'boolean') return true;
    return false;
}

export function isBooleanLike(input: any): boolean {
    if (input == null) return true;
    if (typeof input === 'boolean') return true;
    if (input === 1 || input === 0) return true;
    return false;
}

/**
 * Maps an array of strings and and trims the result, or
 * parses a comma separated list and trims the result
 */
export function parseList(input: any): string[] {
    let strings: string[] = [];

    if (isString(input)) {
        strings = input.split(',');
    } else if (Array.isArray(input)) {
        strings = input.map((val) => {
            if (!val) return '';
            return toString(val);
        });
    } else {
        return [];
    }

    return strings.map((s) => s.trim()).filter((s) => !!s);
}

export function noop(..._args: any[]): any {}

/**
 * A typesafe get function (will always return the correct type)
 *
 * **IMPORTANT** This does not behave like lodash.get,
 * it does not deal with dot notation (nested fields)
 * and it will use the default when dealing with OR statements
 */
export function getField<V>(
    input: undefined,
    field: string,
    defaultVal?: V
): V;
export function getField<T extends {}, P extends keyof T>(
    input: T,
    field: P
): T[P];
export function getField<T extends {}, P extends keyof T>(
    input: T | undefined,
    field: P
): T[P];
export function getField<T extends {}, P extends keyof T>(
    input: T | undefined,
    field: P,
    defaultVal: never[]
): T[P];
export function getField<T extends {}, P extends keyof T, V>(
    input: T | undefined,
    field: P,
    defaultVal: V
): T[P] | V;
export function getField<T extends {}, P extends keyof T, V extends T[P]>(
    input: T | undefined,
    field: P, defaultVal: V
): T[P];
export function getField<T, P extends keyof T, V>(
    input: T,
    field: P,
    defaultVal?: V
): any {
    const result = get(input, field);
    if (isBooleanLike(defaultVal)) {
        if (result == null) return defaultVal;
        return result;
    }
    return result || defaultVal;
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
