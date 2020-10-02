import { createHash } from 'crypto';
import { getTypeOf, isFunction, toString } from '@terascope/utils';

export const HASH_CODE_SYMBOL = Symbol('__hash__');

export function md5(value: string|Buffer): string {
    return createHash('md5').update(value).digest('hex');
}

export function createHashCode(value: unknown): string {
    if (value == null) return '';

    const str = toString(value);

    if (str.length > 35) {
        return `0:${md5(str)}`;
    }

    return `1:${str}`;
}

export function getHashCodeFrom(input: unknown, throwIfNotFound = false): string {
    if (typeof input === 'object' && input != null && input[HASH_CODE_SYMBOL] != null) {
        if (isFunction(input[HASH_CODE_SYMBOL])) {
            return input[HASH_CODE_SYMBOL]();
        }
        return input[HASH_CODE_SYMBOL];
    }

    if (throwIfNotFound) {
        throw new Error(
            `Expected ${toString(input)} (${getTypeOf(input)}) to have ${String(HASH_CODE_SYMBOL)}`
        );
    }
    return createHashCode(input);
}

export function createObject<T extends Record<string, any>>(input: T): T {
    Object.defineProperty(input, HASH_CODE_SYMBOL, {
        value: _createObjectHashCode.bind(input),
        configurable: false,
        enumerable: false,
        writable: false,
    });

    return Object.freeze(input) as T;
}

function _createObjectHashCode() {
    // @ts-expect-error because this bound
    return getHashCodeFrom(Object.entries(this), false);
}
