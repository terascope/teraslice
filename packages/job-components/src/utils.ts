/** A simplified implemation of lodash isString */
export function isString(val: any): val is string {
    return typeof val === 'string' ? true : false;
}

/** Safely convert any input to a string */
export function toString(val: any): string {
    if (val && isFunction(val.toString)) {
        return val.toString();
    }

    return JSON.stringify(val);
}

/**
 * A utility for serializing a buffer to a json object
 */
export function parseJSON<T = object>(buf: Buffer|string): T {
    if (!Buffer.isBuffer(buf) && !isString(buf)) {
        throw new TypeError(`Failure to serialize non-buffer, got "${typeof buf}"`);
    }

    try {
        // @ts-ignore because it does work with buffers
        return JSON.parse(buf);
    } catch (err) {
        throw new Error(`Failure to parse buffer, ${toString(err)}`);
    }
}

/** A simplified implemation of lodash isInteger */
export function isInteger(val: any): val is number {
    if (typeof val !== 'number') return false;
    return Number.isInteger(val);
}

/** A simplified implemation of lodash isPlainObject */
export function isPlainObject(input: any): input is object {
    if (input == null) return false;
    if (Array.isArray(input)) return false;
    if (Buffer.isBuffer(input)) return false;
    if (typeof input !== 'object') return false;
    return true;
}

/** A simplified implemation of lodash castArray */
export function castArray<T>(input: any): T[] {
    if (Array.isArray(input)) return input as T[];
    return [input] as T[];
}

/**
 * Verify an input is a function
*/
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

/**
 * Perform a shallow clone of an object to another, in the fastest way possible
*/
export function fastAssign<T, U>(target: T, source: U) {
    if (!isPlainObject(source)) {
        return target;
    }

    for (const key of Object.keys(source)) {
        target[key] = source[key];
    }

    return target;
}

/**
 * Map an array faster without sparse array handling
*/
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

/** A native implemation of lodash times */ /** A native implemation of lodash times */
export function times(n: number, fn: (index: number) => any) {
    let i = -1;
    const result = Array(n);

    while (++i < n) {
        result[i] = fn(i);
    }
    return result;
}

/** A native implemation of lodash startsWith */
export function startsWith(str: string, val: string) {
    if (typeof str !== 'string') return false;
    return str.startsWith(val);
}

/** A simplified implemation of moment(new Date(val)).isValid() */
export function isValidDate(val: any): boolean {
    const d = new Date(val);
    // @ts-ignore
    return d instanceof Date && !isNaN(d);
}

/** A native implemation of lodash flatten */
export function flatten<T>(val: Many<T[]>): T[] {
    return val.reduce((a, b) => a.concat(b), []);
}

/** A simple definitions of array */
interface Many<T> extends Array<T> {
}

/** A decorator for locking down a property or method */
export function locked() {
    // @ts-ignore
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.configurable = false;
        descriptor.enumerable = false;
        descriptor.writable = false;
    };
}

/** A decorator for making a property, or method enumerable */
export function enumerable(enabled: boolean) {
    // @ts-ignore
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.enumerable = enabled;
    };
}

interface PromiseFn {
    (input: any): Promise<any>;
}

/**
 * Async waterfall function
 */
export function waterfall(input: any, fns: PromiseFn[]): Promise<any> {
    return fns.reduce(async (last, fn) => {
        return fn(await last);
    }, input);
}
