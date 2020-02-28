import set from 'lodash.set';
import get from 'lodash.get';
import unset from 'lodash.unset';
import cloneDeep from 'lodash.clonedeep';
import isPlainObject from 'is-plain-object';
import { WithoutNil } from './interfaces';

export function getFirstValue<T>(input: { [key: string]: T }): T | undefined {
    return Object.values(input)[0];
}
export function getFirstKey<T>(input: T): (keyof T) | undefined {
    return Object.keys(input)[0] as keyof T;
}

/** Check in input has a key */
export function has(data: object|undefined, key: string|number|symbol): boolean {
    if (data == null || typeof data !== 'object') return false;
    if (data instanceof Set || data instanceof Map) {
        if (key in data) return true;
        return data.has(key);
    }
    return key in data;
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

/** Build a new object without null or undefined values (shallow) */
export function withoutNil<T extends object>(input: T): WithoutNil<T> {
    const result: Partial<WithoutNil<T>> = Object.create(null);

    for (const key of Object.keys(input).sort()) {
        if (input[key] != null) {
            result[key] = input[key];
        }
    }

    return result as WithoutNil<T>;
}

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

// export a few dependencies
export {
    isPlainObject,
    cloneDeep,
    get,
    set,
    unset
};
