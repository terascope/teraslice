import { toString } from './strings';
import { getTypeOf } from './core';

export function tryParseJSON(input: any) {
    try {
        return JSON.parse(input);
    } catch (err) {
        return input;
    }
}

/** JSON encoded buffer into a json object */
export function parseJSON<T = object>(buf: Buffer | string): T {
    if (!buf || (!Buffer.isBuffer(buf) && typeof buf !== 'string')) {
        throw new TypeError(`Failure to serialize non-buffer, got "${getTypeOf(buf)}"`);
    }

    try {
        return JSON.parse(buf as string);
    } catch (err) {
        throw new Error(`Failure to parse buffer, ${toString(err)}`);
    }
}
