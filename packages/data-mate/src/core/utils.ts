import { createHash } from 'crypto';
import { getTypeOf, isFunction, toString } from '@terascope/utils';
import {
    HASH_CODE_SYMBOL,
    MAX_16BIT_INT, MAX_32BIT_INT, MAX_8BIT_INT,
    TypedArray, TypedArrayConstructor
} from './interfaces';

/**
 * Gets the correctly sized TypeArray depending on the length of items
 */
export function getPointerArray(size: number): TypedArray {
    const PointerArray = getTypedArrayClass(size);
    return new PointerArray(size);
}

/**
 * Gets the correctly sized TypeArray constructor depending on the size of values being stored
 */
export function getTypedArrayClass(size: number): TypedArrayConstructor {
    const maxIndex = size - 1;

    if (maxIndex <= MAX_8BIT_INT) return Uint8Array;

    if (maxIndex <= MAX_16BIT_INT) return Uint16Array;

    if (maxIndex <= MAX_32BIT_INT) return Uint32Array;

    return Float64Array;
}

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
