import { WithoutNil, FilteredResult } from './interfaces';
import { isBooleanLike } from './booleans';
import { get, isPlainObject } from './deps';
import { DataEntity } from './entities';

/**
 * Similar to is-plain-object but works better when you cloneDeep a DataEntity
*/
export function isSimpleObject(input: unknown): input is Record<string, unknown> {
    if (input == null) return false;
    if (Buffer.isBuffer(input)) return false;
    if (Array.isArray(input)) return false;
    if (input instanceof Set) return false;
    if (input instanceof Map) return false;
    return typeof input === 'object';
}

/**
 * Get the first value in an object
*/
export function getFirstValue<T>(input: { [key: string]: T }): T | undefined {
    return Object.values(input)[0];
}

/**
 * Get the first key in an object
*/
export function getFirstKey<T>(input: T): (keyof T) | undefined {
    return Object.keys(input)[0] as keyof T;
}

/**
 * Verify if the input is a object like type
*/
export function isObjectEntity(input: unknown): boolean {
    return DataEntity.isDataEntity(input) || isSimpleObject(input);
}

/**
 * A clone deep using `JSON.parse(JSON.stringify(input))`
*/
export function fastCloneDeep<T>(input: T): T {
    return JSON.parse(JSON.stringify(input));
}

/** Perform a shallow clone of an object to another, in the fastest way possible */
export function fastAssign<T, U>(target: T, source: U): T & U {
    if (!isObjectEntity(source)) {
        return target as T & U;
    }

    for (const [key, val] of Object.entries(source)) {
        target[key] = val;
    }

    return target as T & U;
}

/** Sort keys on an object */
export function sortKeys<T extends Record<string, unknown>>(
    input: T,
    options: { deep?: boolean } = {}
): T {
    const result: Partial<T> = {};

    for (const _key of Object.keys(input).sort()) {
        const key = _key as keyof T;
        const val = input[key];
        if (options.deep && isPlainObject(val)) {
            result[key] = sortKeys(val as Record<string, unknown>, options) as any;
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
export function withoutNil<T extends any>(input: T): WithoutNil<T> {
    const result: Partial<WithoutNil<T>> = {};

    for (const _key of Object.keys(input as Record<string, any>).sort()) {
        const key = _key as keyof T;
        if (input[key] != null) {
            result[key] = input[key] as any;
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
 * A type safe get function (will always return the correct type)
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
export function getField<T extends any, P extends keyof T>(
    input: T,
    field: P
): T[P];
export function getField<T extends any, P extends keyof T>(
    input: T | undefined,
    field: P
): T[P];
export function getField<T extends any, P extends keyof T>(
    input: T | undefined,
    field: P,
    defaultVal: never[]
): T[P];
export function getField<T extends any, P extends keyof T, V>(
    input: T | undefined,
    field: P,
    defaultVal: V
): T[P] | V;
export function getField<T extends any, P extends keyof T, V extends T[P]>(
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

/**
 * Compares two values and returns a boolean if they are the same.
 * Object keys are sorted before comparison, arrays are NOT sorted and
 * are compared value for value
 *
 * @example
        isSame({ key1: 1, key2: 2 }, { key2: 2, key1: 1 }) === true;
        isSame(null, null) === true;
        isSame(undefined, undefined) === true;
        isSame(NaN, NaN) === true;
        isSame(3, 3) === true
        isSame('hello', 'hello') === true
        isSame([1, 2, 3], [1, 2, 3]) === true
        isSame([{ some: 'obj' }], [{ some: 'obj' }]) === true

        isSame(undefined, null) === false;
        isSame([1, 2, 3], [1, 3, 2]) === false
        isSame([1, 2, 3], [1, 2, undefined, 3]) === false
        isSame(true, 'true') === false;
*/
export function isSame(input: unknown, target: unknown): boolean {
    if (isObjectEntity(input)) {
        if (isObjectEntity(target)) {
            const sortedInput = sortKeys(input as Record<string, unknown>, { deep: true });
            const sortedTarget = sortKeys(target as Record<string, unknown>, { deep: true });
            return JSON.stringify(sortedInput) === JSON.stringify(sortedTarget);
        }
        return false;
    }

    if (Array.isArray(input)) {
        if (Array.isArray(target)) {
            if (input.length !== target.length) return false;
            return input.every((val, index) => isSame(val, target[index]));
        }
        return false;
    }

    return Object.is(input, target);
}

/**
 * Check if a object has property (and not included in the prototype)
 * Different from has since it doesn't deal with dot notation values.
*/
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function hasOwn(obj: any, prop: string|symbol|number): boolean {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
