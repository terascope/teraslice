import { toString } from './strings';
import { getTypeOf } from './deps';

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
