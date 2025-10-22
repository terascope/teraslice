import { WithoutNil, FilteredResult } from './interfaces.js';
import { isBooleanLike } from './booleans.js';
import { get, getTypeOf, isPlainObject } from './deps.js';
import { DataEntity } from './entities/index.js';
import { isArrayLike, isArray } from './arrays.js';
import { isBuffer } from './buffers.js';
import { isString, trim, isPrimitiveValue } from './strings.js';
import { toNumber } from './numbers.js';

/**
 * Similar to is-plain-object but works better when you cloneDeep a DataEntity
*/
export function isSimpleObject(input: unknown): input is Record<string, unknown> {
    if (input == null) return false;
    if (isBuffer(input)) return false;
    if (isArrayLike(input)) return false;
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
export function getFirstKey<T extends object>(input: T): (keyof T) | undefined {
    return Object.keys(input)[0] as keyof T;
}

/**
 * Verify that k is a key of object O
*/
export function isKey<T extends object>(O: T, k: PropertyKey): k is keyof T {
    return k in O;
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
export function fastAssign<T extends object, U extends object>(target: T, source: U): T & U {
    if (!isObjectEntity(source)) {
        return target as T & U;
    }

    for (const [key, val] of Object.entries(source)) {
        target[key as keyof typeof target] = val;
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
export function mapValues<T extends object, R = T>(
    input: T,
    fn: (value: T[keyof T], key: (keyof T)) => any
): R {
    const result = {} as Partial<R>;

    for (const [key, val] of Object.entries(input)) {
        result[key as keyof R] = fn(val, key as keyof T);
    }

    return result as R;
}

/** Map the keys of an object */
export function mapKeys<T extends object, R = T>(
    input: T,
    fn: (value: T[keyof T], key: (keyof T)) => any
): R {
    const result = {} as Partial<R>;

    for (const [key, val] of Object.entries(input)) {
        result[fn(val, key as keyof T) as keyof R] = val;
    }

    return result as R;
}

/** Build a new object without null or undefined values (shallow) */
export function withoutNil<T>(input: T): WithoutNil<T> {
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
    T extends object, I extends(keyof T), E extends (keyof T)
>(data: T, by?: {
    includes?: I[];
    excludes?: E[];
}): FilteredResult<T, I, E> {
    const {
        includes = [],
        excludes = []
    } = by || {};

    const result: Record<string, any> = {};
    Object.keys(data)
        .filter((key) => {
            const included = includes.length ? includes.includes(key as I) : true;
            const excluded = excludes.length ? excludes.includes(key as E) : false;
            return included && !excluded;
        })
        .sort()
        .forEach((key) => {
            if (isKey(data, key)) {
                result[key] = data[key];
            }
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
export function getField<T, P extends keyof T>(
    input: T,
    field: P
): T[P];
export function getField<T, P extends keyof T>(
    input: T | undefined,
    field: P
): T[P];
export function getField<T, P extends keyof T>(
    input: T | undefined,
    field: P,
    defaultVal: never[]
): T[P];
export function getField<T, P extends keyof T, V>(
    input: T | undefined,
    field: P,
    defaultVal: V
): T[P] | V;
export function getField<T, P extends keyof T, V extends T[P]>(
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
 * Check if a object has property (and not included in the prototype)
 * Different from has since it doesn't deal with dot notation values.
*/

export function hasOwn(obj: any, prop: string | symbol | number): boolean {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function lookup(input: unknown): (key: unknown) => any {
    // lookup entity can be a string, object or array
    if (!isObjectEntity(input) && !isString(input) && !isArray(input)) {
        throw Error(`input must be an Object Entity, String, received ${getTypeOf(input)}`);
    }

    return function _lookup(key: unknown) {
        if (key == null) return null;

        // This may be too restrictive at some point
        if (!isPrimitiveValue(key)) {
            throw Error(`lookup key must be not be an object, received ${getTypeOf(key)}`);
        }

        if (isString(input)) {
            return _lookupStringToObject(input)[key as string];
        }

        if (isArray(input)) return input[toNumber(key)];

        const lookupObj = input as Record<string, unknown>;
        return lookupObj[key as string];
    };
}

function _lookupStringToObject(stringInput: string): Record<string, string> {
    return stringInput.split('\n').reduce((asObj: Record<string, string>, line) => {
        const [k, v] = trim(line).split(':', 2);

        asObj[trim(k)] = trim(v);

        return asObj;
    }, {});
}
