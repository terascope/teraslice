import { createHash, BinaryToTextEncoding } from 'node:crypto';
import { primitiveToString } from '@terascope/core-utils';

export function bufferEncode(bufferEncoding: BufferEncoding) {
    return function _bufferEncode(input: unknown): string {
        return Buffer.from(primitiveToString(input)).toString(bufferEncoding);
    };
}

export function cryptoEncode(hash: string, digest: BinaryToTextEncoding) {
    return function _cryptoEncode(input: unknown): string {
        return createHash(hash).update(primitiveToString(input))
            .digest(digest);
    };
}

export function encodeURL(input: unknown): string {
    return encodeURIComponent(primitiveToString(input));
}

export function encodeAny(
    algo: string, digest?: BinaryToTextEncoding
): (input: unknown) => string {
    if (algo === 'url') return encodeURL;
    if (algo === 'base64' || algo === 'hex') return bufferEncode(algo);
    return cryptoEncode(algo, digest ?? 'hex');
}
