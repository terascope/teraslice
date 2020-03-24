import { getTypeOf } from './deps';

export function ensureBuffer(input: string|Buffer, encoding: BufferEncoding = 'utf8'): Buffer {
    if (typeof input === 'string') {
        return Buffer.from(input, encoding);
    }
    if (Buffer.isBuffer(input)) {
        return input;
    }
    throw new Error(`Invalid input given, expected string or buffer, got ${getTypeOf(input)}`);
}

export function isBuffer(input: any): input is Buffer {
    return input != null && Buffer.isBuffer(input);
}
