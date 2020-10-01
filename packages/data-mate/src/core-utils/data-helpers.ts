import { createHash } from 'crypto';
import { getTypeOf, toString } from '@terascope/utils';

export const HASH_CODE_SYMBOL = Symbol('__hash__');

export function md5(value: string|Buffer): string {
    return createHash('md5').update(value).digest('hex');
}

export function createHashCode(value: unknown): string|null {
    if (value == null) return null;

    const str = toString(value);

    if (str.length > 35) {
        return `0:${md5(str)}`;
    }

    return `1:${str}`;
}

export function getHashCodeFrom(input: unknown, throwIfNotFound = false): string|null {
    if (input == null) return null;
    if (typeof input === 'object' && input != null && input[HASH_CODE_SYMBOL] != null) {
        return input[HASH_CODE_SYMBOL];
    }

    if (throwIfNotFound) {
        throw new Error(
            `Expected ${toString(input)} (${getTypeOf(input)}) to have ${String(HASH_CODE_SYMBOL)}`
        );
    }
    return toString(input);
}

export function createObject<T extends Record<string, any>>(input: T, sortKeys = true): T {
    const result: Record<string, any> = {};
    const keys = sortKeys ? Object.keys(input).sort() : Object.keys(input);

    let hash = '';
    const len = keys.length;
    for (let i = 0; i < len; i++) {
        const key = keys[i];
        if (input[key] != null) {
            result[key] = input[key];
            hash += createHashCode(input[key]);
        }
    }

    Object.defineProperty(result, HASH_CODE_SYMBOL, {
        value: createHashCode(hash),
        configurable: false,
        enumerable: false,
        writable: false,
    });

    return Object.freeze(result) as T;
}
