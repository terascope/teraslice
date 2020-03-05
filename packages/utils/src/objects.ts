import { WithoutNil, FilteredResult } from './interfaces';
import { isBooleanLike } from './booleans';
import { get, isPlainObject } from './deps';

/**
 * Similar to is-plain-object but works better when clone deeping a DataEntity
*/
export function isSimpleObject(input: any): input is object {
    if (input == null) return false;
    if (Buffer.isBuffer(input)) return false;
    if (Array.isArray(input)) return false;
    if (input instanceof Set) return false;
    if (input instanceof Map) return false;
    return typeof input === 'object';
}

export function getFirstValue<T>(input: { [key: string]: T }): T | undefined {
    return Object.values(input)[0];
}

export function getFirstKey<T>(input: T): (keyof T) | undefined {
    return Object.keys(input)[0] as keyof T;
}

/**
 * A clone deep using `JSON.parse(JSON.stringify(input))`
*/
export function fastCloneDeep<T>(input: T): T {
    return JSON.parse(JSON.stringify(input));
}

/** Perform a shallow clone of an object to another, in the fastest way possible */
export function fastAssign<T, U>(target: T, source: U) {
    if (!isPlainObject(source)) {
        return target;
    }

    for (const [key, val] of Object.entries(source)) {
        target[key] = val;
    }

    return target;
}

/** Sort keys on an object */
export function sortKeys<T extends object>(
    input: T,
    options: { deep?: boolean } = {}
): T {
    const result: Partial<T> = {};

    for (const key of Object.keys(input).sort()) {
        const val = input[key];
        if (options.deep && isPlainObject(val)) {
            result[key] = sortKeys(val, options);
        } else {
            result[key] = val;
        }
    }

    return result as T;
}

/** Map the values of an object */
export function mapValues<T, R = T>(input: T, fn: (value: T[keyof T], key: (keyof T)) => any): R {
    const result = {} as Partial<R>;

    for (const [key, val] of Object.entries(input)) {
        result[key] = fn(val, key as keyof T);
    }

    return result as R;
}

/** Map the keys of an object */
export function mapKeys<T, R = T>(input: T, fn: (value: T[keyof T], key: (keyof T)) => any): R {
    const result = {} as Partial<R>;

    for (const [key, val] of Object.entries(input)) {
        result[fn(val, key as keyof T)] = val;
    }

    return result as R;
}

/** Build a new object without null or undefined values (shallow) */
export function withoutNil<T extends object>(input: T): WithoutNil<T> {
    const result: Partial<WithoutNil<T>> = {};

    for (const key of Object.keys(input).sort()) {
        if (input[key] != null) {
            result[key] = input[key];
        }
    }

    return result as WithoutNil<T>;
}

/**
 * Filters the keys of an object, by list of included key and excluded
*/
export function filterObject<
    T, I extends(keyof T), E extends (keyof T)
>(data: T, by?: {
    includes?: I[];
    excludes?: E[];
}): FilteredResult<T, I, E> {
    const {
        includes = [],
        excludes = []
    } = by || {};

    const result: Partial<FilteredResult<T, I, E>> = {};
    Object.keys(data)
        .filter((key) => {
            const included = includes.length ? includes.includes(key as I) : true;
            const excluded = excludes.length ? excludes.includes(key as E) : false;
            return included && !excluded;
        })
        .sort()
        .forEach((key) => {
            result[key] = data[key];
        });

    return result as FilteredResult<T, I, E>;
}

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
