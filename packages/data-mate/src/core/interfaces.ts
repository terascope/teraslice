export const HASH_CODE_SYMBOL = Symbol('__hash__');

export const MAX_8BIT_INT = (2 ** 8) - 1;
export const MAX_16BIT_INT = (2 ** 16) - 1;
export const MAX_32BIT_INT = (2 ** 32) - 1;

export type TypedArray = Uint8Array
|Uint16Array
|Uint32Array
|Float64Array;

export type TypedArrayConstructor = Uint8ArrayConstructor
|Uint16ArrayConstructor
|Uint32ArrayConstructor
|Float64ArrayConstructor;

export type ReadableDataValue<T> = Readonly<{
    /**
     * A list of the value positions
    */
    i: readonly number[];
    /**
     * The non-null value
    */
    v: T;
}>;

export type WritableDataValue = number[];

export type FieldArg<K extends (string|number|symbol)> = K[]|(readonly K[])|K;
