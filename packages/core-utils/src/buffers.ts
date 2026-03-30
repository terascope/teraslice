import { isString } from './strings.js';
import { getTypeOf } from './deps.js';

/**
 * Convert an input to a Buffer if possible
*/
export function ensureBuffer(input: string | Buffer, encoding: BufferEncoding = 'utf8'): Buffer {
    if (isString(input)) {
        return Buffer.from(input, encoding);
    }
    if (isBuffer(input)) {
        return input;
    }
    throw new Error(`Invalid input given, expected string or buffer, got ${getTypeOf(input)}`);
}

/**
 * Check if an input is an nodejs Buffer
*/
export function isBuffer(input: unknown): input is Buffer {
    if (typeof Buffer === 'undefined') return false;
    return Buffer.isBuffer(input);
}

export function bufferToString(input: unknown, format = 'base64url' as BufferEncoding) {
    if (isString(input)) return input;
    if (isBuffer(input)) {
        return input.toString(format);
    }
    throw new Error(`Invalid input given, expected string or buffer, got ${getTypeOf(input)}`);
}
