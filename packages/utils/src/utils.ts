import isPlainObject from 'is-plain-object';
import cloneDeep from 'lodash.clonedeep';
import kindOf from 'kind-of';
import { WithoutNil } from './interfaces';

/** A simplified implemation of lodash isString */
export function isString(val: any): val is string {
    return typeof val === 'string' ? true : false;
}

/** Safely convert any input to a string */
export function toString(val: any): string {
    if (val == null) return '';
    if (isString(val)) return val;
    if (val && typeof val === 'object' && val.message && val.stack) {
        return val.toString();
    }

    return JSON.stringify(val);
}

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
export function parseJSON<T = object>(buf: Buffer|string): T {
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

/** A simplified implemation of lodash isInteger */
export function isInteger(val: any): val is number {
    if (typeof val !== 'number') return false;
    return Number.isInteger(val);
}

// export a few dependencies
export { isPlainObject, cloneDeep };

/** A simplified implemation of lodash castArray */
export function castArray<T>(input: T|T[]): T[] {
    if (Array.isArray(input)) return input;
    return [input];
}

/** Verify an input is a function */
export function isFunction(input: any): input is Function {
    return input && typeof input === 'function' ? true : false;
}

/**
 * If the input is an array it will return the first item
 * else if it will return the input
 */
export function getFirst<T>(input: T|T[]): T {
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

/** Map an array faster without sparse array handling */
export function fastMap<T, U>(arr: T[], fn: (val: T, index: number) => U): U[] {
    const length = arr.length;
    const result = Array(length);

    let i = -1;
    while (++i < length) {
        result[i] = fn(arr[i], i);
    }

    return result;
}

/** A native implemation of lodash random */
export function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** A native implemation of lodash uniq */
export function uniq<T>(arr: T[]): T[] {
    return [...new Set(arr)];
}

/** A native implemation of lodash times */
export function times(n: number): number[];
export function times<T>(n: number, fn: (index: number) => T): T[];
export function times<T>(n: number, fn?: (index: number) => T): T[] {
    let i = -1;
    const result = Array(n);

    while (++i < n) {
        result[i] = fn != null ? fn(i) : i;
    }

    return result;
}

/** A native implemation of lodash startsWith */
export function startsWith(str: string, val: string) {
    if (typeof str !== 'string') return false;
    return str.startsWith(val);
}

export function truncate(str: string, len: number): string {
    const sliceLen = (len - 4) > 0 ? len - 4 : len;
    return str.length >= len ? `${str.slice(0, sliceLen)} ...` : str;
}

/** Check if an input is a number */
export function isNumber(input: any): input is number {
    return typeof input === 'number' && !Number.isNaN(input);
}

/** Convert any input to a number, return Number.NaN if unable to convert input  */
export function toNumber(input: any): number {
    if (typeof input === 'number') return input;

    return Number(input);
}

/** Convert any input to a integer, return false if unable to convert input  */
export function toInteger(input: any): number|false {
    if (Number.isInteger(input)) return input;
    const val = Number.parseInt(input, 10);
    if (isNumber(val)) return val;
    return false;
}

/** Convert any input into a boolean, this will work with stringified boolean */
export function toBoolean(input: any): boolean {
    const val: any = isString(input) ? trimAndToLower(input) : input;
    const thruthy = [1, '1', true, 'true'];
    return thruthy.includes(val);
}

/** safely trim and to lower a input, useful for string comparison */
export function trimAndToLower(input?: string): string {
    return toString(input).trim().toLowerCase();
}

/** A simplified implemation of moment(new Date(val)).isValid() */
export function isValidDate(val: any): boolean {
    const d = new Date(val);
    // @ts-ignore
    return d instanceof Date && !isNaN(d);
}

/** Check if the data is valid and return if it is */
export function getValidDate(val: any): Date|false {
    const d = new Date(val);
    // @ts-ignore
    return d instanceof Date && !isNaN(d) && d;
}

/** A native implemation of lodash flatten */
export function flatten<T>(val: Many<T[]>): T[] {
    return val.reduce((a, b) => a.concat(b), []);
}

/** A simple definitions of array */
interface Many<T> extends Array<T> {
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

/** A decorator for locking down a method */
export function locked() {
    // @ts-ignore
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.configurable = false;
        descriptor.enumerable = false;
        descriptor.writable = false;
    };
}

/** A decorator for making a method enumerable or none-enumerable */
export function enumerable(enabled = true) {
    // @ts-ignore
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.enumerable = enabled;
    };
}

/** Change first character in string to upper case */
export function firstToUpper(str: string): string {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

/** Build a new object without null or undefined values (shallow) */
export function withoutNil<T extends object>(input: T): WithoutNil<T> {
    // @ts-ignore
    const result: WithoutNil<T> = {};

    for (const [key, val] of Object.entries(input)) {
        if (val != null) {
            result[key] = val;
        }
    }

    return result;
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
        strings = input.map((input) => {
            if (!input) return '';
            return toString(input);
        });
    } else {
        return [];
    }

    return strings
        .map((s) => s.trim())
        .filter((s) => !!s);
}

/**
 * Like parseList, except it returns number
*/
export function parseNumberList(input: any): number[] {
    let items: (number|string)[] = [];

    if (isString(input)) {
        items = input.split(',');
    } else if (Array.isArray(input)) {
        items = input;
    } else if (isNumber(input)) {
        return [input];
    } else {
        return [];
    }

    return items
        // filter out any empty string
        .filter((item) => {
            if (item == null) return false;
            if (isString(item) && !item.trim().length) return false;
            return true;
        })
        .map(toNumber)
        .filter(isNumber) as number[];
}
