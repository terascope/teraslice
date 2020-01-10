import { Many, WithoutNil, ListOfRecursiveArraysOrValues } from './interfaces';

/** A native implemation of lodash flatten */
export function flatten<T>(val: Many<T[]>): T[] {
    return val.reduce((a, b) => a.concat(b), []);
}

export function flattenDeep<T>(val: ListOfRecursiveArraysOrValues<T>): T[] {
    return val.reduce((a: T[], b) => {
        if (Array.isArray(b)) {
            return a.concat(flattenDeep(b));
        }
        return a.concat(b);
    }, []);
}

/** A simplified implemation of lodash castArray */
export function castArray<T>(input: T|T[]): T[] {
    if (input == null) return [];
    if (Array.isArray(input)) return input;
    return [input];
}

/**
 * Concat and unique the items in the array
 * Any non-array value will be converted to an array
*/
export function concat<T>(arr: T|T[], arr1?: T|T[]): T[] {
    return uniq(
        castArray(arr)
            .concat(arr1 ? castArray(arr1) : []),
    );
}

/** Build a new object without null or undefined values (shallow) */
export function withoutNil<T extends object>(input: T): WithoutNil<T> {
    // @ts-ignore
    const result: WithoutNil<T> = {};

    for (const key of Object.keys(input).sort()) {
        if (input[key] != null) {
            result[key] = input[key];
        }
    }

    return result;
}

/** A native implemation of lodash uniq */
export function uniq<T>(arr: T[]|Set<T>): T[] {
    if (arr instanceof Set) return [...arr];
    return [...new Set(arr)];
}

/** A native implemation of lodash times */
export function times(n: number): number[];
export function times<T>(n: number, fn: (index: number) => T): T[];
export function times<T>(n: number, fn?: (index: number) => T): (T[])|(number[]) {
    if (fn) return Array.from({ length: n }, (_, x) => fn(x));
    return Array.from({ length: n }, (_, x) => x);
}

/** Map an array faster without sparse array handling */
export function fastMap<T, U>(arr: T[], fn: (val: T, index: number) => U): U[] {
    const { length } = arr;
    const result = Array(length);

    let i = -1;
    while (++i < length) {
        result[i] = fn(arr[i], i);
    }

    return result;
}

/** Chunk an array into specific sizes */
export function chunk<T>(dataArray: T[]|Set<T>, size: number): T[][] {
    if (size < 1) return Array.isArray(dataArray) ? [dataArray] : [[...dataArray]];
    const results: T[][] = [];
    let chunked: T[] = [];

    for (const data of dataArray) {
        chunked.push(data);
        if (chunked.length === size) {
            results.push(chunked);
            chunked = [];
        }
    }

    if (chunked.length > 0) results.push(chunked);
    return results;
}

/** Safely check if an array, object, map, set has a key */
export function includes(input: any, key: string): boolean {
    if (!input) return false;
    if (Array.isArray(input) || typeof input === 'string') return input.includes(key);
    if (typeof input.has === 'function') return input.has(key);
    if (typeof input === 'object') {
        return key in input;
    }
    return false;
}

/**
 * If the input is an array it will return the first item
 * else if it will return the input
 */
export function getFirst<T>(input: T | T[]): T {
    return castArray(input)[0];
}
