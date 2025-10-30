import { Many, ListOfRecursiveArraysOrValues, TypedArray } from '@terascope/types';
import { get } from './deps.js';
import { isBuffer } from './buffers.js';
import { isKey } from './objects.js';

/** A native implementation of lodash flatten */
export function flatten<T>(val: Many<T[]>): T[] {
    return val.reduce((a, b) => a.concat(b), []);
}

export function flattenDeep<T>(val: ListOfRecursiveArraysOrValues<T>): T[] {
    return val.reduce((a, b): T[] => {
        if (isArrayLike(b)) {
            return (a as T[]).concat(flattenDeep(b));
        }
        return (a as T[]).concat(b);
    }, []) as any;
}

/** A simplified implementation of lodash castArray */
export function castArray<T>(input: T | undefined | null|(T[])|(readonly T[])): T[] {
    if (input == null) return [];
    if (isArrayLike(input)) return input;
    if (input instanceof Set) return [...input];
    return [input as T];
}

/**
 * Concat and unique the items in the array
 * Any non-array value will be converted to an array
*/
export function concat<T>(arr: T|(T[]), arr1?: T|(T[])): readonly T[];
export function concat<T>(arr: readonly T[], arr1?: readonly T[]): readonly T[];
export function concat<T>(arr: readonly T[], arr1?: T|(T[])): readonly T[];
export function concat<T>(arr: T|(T[]), arr1?: T|(T[])): T[] {
    return uniq(
        castArray(arr)
            .concat(arr1 ? castArray(arr1) : []),
    );
}

/** A native implementation of lodash uniq */
export function uniq<T>(arr: T[] | Set<T>): T[] {
    if (arr instanceof Set) return [...arr];
    return [...new Set(arr)];
}

/** Sort an arr or set */
export function sort<T>(
    arr: T[]|(readonly T[]) | Set<T>,
    compare?: (a: T, b: T) => number
): T[] {
    if (arr instanceof Set) return [...arr].sort(compare);
    if (isArrayLike(arr)) return arr.sort(compare);
    return arr as T[];
}

const numLike = {
    bigint: true,
    number: true,
} as const;

/** Sort by path or function that returns the values to sort with */
export function sortBy<T, V = any>(
    arr: T[] | Set<T>,
    fnOrPath: ((value: T) => V) | string,
): T[] {
    return sort(arr, (a, b) => {
        const aVal = _getValFnOrPath<T, V>(a, fnOrPath);
        const bVal = _getValFnOrPath<T, V>(b, fnOrPath);
        if (isKey(numLike, typeof aVal) && isKey(numLike, typeof bVal)) {
            return (aVal as any) - (bVal as any);
        }
        if (aVal < bVal) {
            return -1;
        }
        if (aVal > bVal) {
            return 1;
        }
        return 0;
    });
}

function _getValFnOrPath<T, V = any>(input: T, fnOrPath: ((value: T) => V) | string): V {
    const uniqVal = typeof fnOrPath === 'function'
        ? fnOrPath(input)
        : get(input, fnOrPath);
    return uniqVal;
}

/**
 * Get the unique values by a path or function that returns the unique values
*/
export function uniqBy<T, V = any>(
    values: T[] | readonly T[],
    fnOrPath: ((value: T) => V) | string,
): T[] {
    const _values = new Set<V>();
    const result: T[] = [];
    for (const value of values) {
        const uniqVal = _getValFnOrPath(value, fnOrPath);
        if (uniqVal != null && !_values.has(uniqVal)) {
            _values.add(uniqVal);
            result.push(value);
        }
    }
    return result;
}

/** A native implementation of lodash times */
export function times(n: number): number[];
export function times<T>(n: number, fn: (index: number) => T): T[];
export function times<T>(n: number, fn?: (index: number) => T): (T[])|(number[]) {
    if (fn) return Array.from({ length: n }, (_, x) => fn(x));
    return Array.from({ length: n }, (_, x) => x);
}

/** Like times but an iterable */
export function timesIter(n: number): Iterable<number>;
export function timesIter<T>(n: number, fn: (index: number) => T): Iterable<T>;
export function* timesIter<T>(n: number, fn?: (index: number) => T): Iterable<number | T> {
    for (let i = 0; i < n; i++) {
        if (fn) yield fn(i);
        yield i;
    }
}

/** Chunk an array into specific sizes */
export function chunk<T>(dataArray: Iterable<T>, size: number): T[][] {
    return Array.from(chunkIter(dataArray, size));
}

/** Chunk an array into specific size, by using an iterator */
export function* chunkIter<T>(dataArray: Iterable<T>, size: number): Iterable<T[]> {
    if (size < 1) {
        throw new RangeError(`Expected chunk size to be >0, got ${size}`);
    }
    if (isArrayLike(dataArray)) {
        yield* _chunkArrayIterator(dataArray, size);
        return;
    }

    let batch: T[] = [];

    for (const data of dataArray) {
        batch.push(data);
        if (batch.length === size) {
            yield batch;
            batch = [];
        }
    }

    if (batch.length) {
        yield batch;
    }
}

/**
 * This is an optimization for array like chunking
*/
function* _chunkArrayIterator<T>(arr: T[], size: number): Iterable<T[]> {
    for (let x = 0; x < Math.ceil(arr.length / size); x++) {
        const start = x * size;
        const end = start + size;

        yield arr.slice(start, end);
    }
}

/** Safely check if an array, object, map, set has a key */
export function includes(input: unknown, key: string): boolean {
    if (!input) return false;
    if (isArrayLike(input) || typeof input === 'string') return input.includes(key);
    const obj = input as any;
    if (typeof obj.has === 'function') return obj.has(key);
    if (typeof obj === 'object') {
        return key in obj;
    }
    return false;
}

/**
 * If the input is an array it will return the first item
 * else if it will return the input
 */
export function getFirst<T>(input: T|(T[])|(readonly T[])): T | undefined {
    return castArray(input)[0];
}

/**
 * If the input is an array it will return the first item
 * else if it will return the input
 */
export function getLast<T>(input: T|(T[])|(readonly T[])): T | undefined {
    return castArray(input).slice(-1)[0];
}

/**
 * Check if an input is an array, just Array.isArray
*/
export function isArray<T = any[]>(input: unknown): input is T {
    return Array.isArray(input);
}

/**
 * Check if an input is an TypedArray instance like: Uint8Array or Uint16Array.
 * This excludes nodejs Buffers since they aren't really the same.
*/
export function isTypedArray<T = TypedArray>(input: unknown): input is T {
    return ArrayBuffer.isView(input) && !isBuffer(input);
}

/**
 * Check if an input is an TypedArray or Array instance
*/
export function isArrayLike<T = any[]>(input: unknown): input is T {
    return Array.isArray(input) || isTypedArray(input);
}
