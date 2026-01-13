import { getTypeOf } from './deps.js';

/**
 * Convert an input to a Buffer if possible
*/
export function ensureBuffer(input: string | Buffer, encoding: BufferEncoding = 'utf8'): Buffer {
    if (typeof input === 'string') {
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
