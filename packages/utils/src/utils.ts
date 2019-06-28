import isPlainObject from 'is-plain-object';
import cloneDeep from 'lodash.clonedeep';
import get from 'lodash.get';
import set from 'lodash.set';
import kindOf from 'kind-of';
import { isString, toString, firstToUpper, trimAndToLower } from './strings';

/** Check if an input is empty, similar to lodash.isEmpty */
export function isEmpty(val?: any): boolean {
    if (val == null) return true;
    if (val.size != null) return !val.size;
    if (typeof val === 'object') return !Object.keys(val).length;
    if (val.length != null) return !val.length;

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
    if (val) {
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

// export a few dependencies
export { isPlainObject, cloneDeep, get, set };

/** Verify an input is a function */
export function isFunction(input: any): input is Function {
    return input && typeof input === 'function' ? true : false;
}

/**
 * If the input is an array it will return the first item
 * else if it will return the input
 */
export function getFirst<T>(input: T | T[]): T {
    return Array.isArray(input) ? input[0] : input;
}

/** Perform a shallow clone of an object to another, in the fastest way possible */
export function fastAssign<T, U>(target: T, source: U) {
    if (!isPlainObject(source)) {
        return target;
    }

    for (const key of Object.keys(source)) {
        target[key] = source[key];
    }

    return target;
}

/** Convert any input into a boolean, this will work with stringified boolean */
export function toBoolean(input: any): boolean {
    const val: any = isString(input) ? trimAndToLower(input) : input;
    const thruthy = [1, '1', true, 'true', 'yes'];
    return thruthy.includes(val);
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
        strings = input.map(val => {
            if (!val) return '';
            return toString(val);
        });
    } else {
        return [];
    }

    return strings.map(s => s.trim()).filter(s => !!s);
}

export function noop(...args: any[]): any {}

/**
 * A typesafe get function (will always return the correct type)
 *
 * **IMPORTANT** This does not behave like lodash.get,
 * it does not deal with dot notation (nested fields)
 * and it will use the default when dealing with OR statements
 */
export function getField<V>(input: undefined, field: string, defaultVal?: V): V;
export function getField<T extends {}, P extends keyof T>(input: T, field: P): T[P];
export function getField<T extends {}, P extends keyof T>(input: T | undefined, field: P): T[P];
export function getField<T extends {}, P extends keyof T, V>(input: T | undefined, field: P, defaultVal: V): T[P] | V;
export function getField<T extends {}, P extends keyof T, V extends T[P]>(input: T | undefined, field: P, defaultVal: V): T[P];
export function getField<T, P extends keyof T, V>(input: T, field: P, defaultVal?: V): any {
    const result = get(input, field);
    if (isBooleanLike(defaultVal)) {
        if (result == null) return defaultVal;
        return result;
    }
    return result || defaultVal;
}
