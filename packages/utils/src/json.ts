import { toString } from './strings.js';
import { getTypeOf } from './deps.js';
import { isBigInt, bigIntToJSON } from './numbers.js';
import { hasOwn, isKey } from './objects.js';

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
        // remove null unicode/hex code characters before parsing
        const removedNull = (buf as string).toString().replace(/\0/g, '');

        return JSON.parse(removedNull);
    } catch (err: unknown) {
        throw new Error(`Failure to parse buffer, ${toString(err)}`);
    }
}

/** This will try to convert any BigInt values to a value that is compatible with JSON,
 * it will iterate through an array, and check all the keys of an object
  */
export function toJSONCompatibleValue(input: unknown): any {
    if (isBigInt(input)) return bigIntToJSON(input);
    if (input == null || typeof input !== 'object') return input;

    if (Array.isArray(input)) {
        return input.map(toJSONCompatibleValue);
    }

    const obj: Record<string, any> = {};

    for (const prop in input) {
        if (hasOwn(input, prop) && isKey(input, prop)) {
            obj[prop] = toJSONCompatibleValue(input[prop]);
        }
    }

    return obj;
}
