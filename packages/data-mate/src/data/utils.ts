import { TypedArray, TypedArrayConstructor } from './interfaces';

export const MAX_8BIT_INT = (2 ** 8) - 1;
export const MAX_16BIT_INT = (2 ** 16) - 1;
export const MAX_32BIT_INT = (2 ** 32) - 1;

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
