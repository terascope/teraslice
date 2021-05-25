import { toString } from './strings';
import { getTypeOf } from './deps';
import { isBigInt, bigIntToJSON } from './numbers';
import { hasOwn } from './objects';

export function tryParseJSON<T = any>(input: unknown): T {
    try {
        return JSON.parse(input as string);
    } catch (err) {
        return input as any;
    }
}

/** JSON encoded buffer into a json object */
export function parseJSON<T = Record<string, unknown>>(buf: Buffer | string): T {
    if (!buf || (!Buffer.isBuffer(buf) && typeof buf !== 'string')) {
        throw new TypeError(`Failure to serialize non-buffer, got "${getTypeOf(buf)}"`);
    }

    try {
        return JSON.parse(buf as string);
    } catch (err) {
        throw new Error(`Failure to parse buffer, ${toString(err)}`);
    }
}

/** This will try to convert any BigInt values to a value that is compatible with JSON, it will
 * it will iterate through an array, and check all the keys of an object
  */
export function toJSONCompatibleValue(input: unknown): any {
    if (isBigInt(input)) return bigIntToJSON(input);
    if (input == null || typeof input !== 'object') return input;

    if (Array.isArray(input)) {
        return input.map(toJSONCompatibleValue);
    }

    const obj = {};

    for (const prop in input) {
        if (hasOwn(input, prop)) {
            obj[prop] = toJSONCompatibleValue(input[prop]);
        }
    }

    return obj;
}
