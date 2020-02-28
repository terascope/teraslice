import kindOf from 'kind-of';
import { Nil } from './interfaces';
import {
    isString,
    toString,
    firstToUpper,
    trimAndToLower
} from './strings';

export function isNil<T>(input: T|Nil): input is Nil {
    return input == null;
}
export function isNotNil<T>(input: T|Nil): boolean {
    return input != null;
}

/** Check if an input is empty, similar to lodash.isEmpty */
export function isEmpty<T>(val?: T|null|undefined): val is undefined {
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

function isFalsy(input: any) {
    return [0, '0', 'false', 'no'].includes(input);
}

function isTruthy(input: any) {
    return [1, '1', 'true', 'yes'].includes(input);
}

/** Convert any input into a boolean, this will work with stringified boolean */
export function toBoolean(input: any): boolean {
    const val: string = isString(input) ? trimAndToLower(input) : `${input}`;
    if (isTruthy(val)) return true;
    if (isFalsy(val)) return false;

    return Boolean(input);
}

export function isBoolean(input: any): input is boolean {
    if (typeof input === 'boolean') return true;
    return false;
}

export function isBooleanLike(input: any): boolean {
    if (input == null) return true;
    if (typeof input === 'boolean') return true;
    if (isFalsy(input) || isTruthy(input)) return true;
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
