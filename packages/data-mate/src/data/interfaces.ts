export type TypedArray = Uint8Array
|Uint16Array
|Uint32Array
|Float64Array;

export type TypedArrayConstructor = Uint8ArrayConstructor
|Uint16ArrayConstructor
|Uint32ArrayConstructor
|Float64ArrayConstructor;

export type ReadableDataValue<T> = Readonly<{
    indices: readonly number[];
    value: T;
}>;

export type WritableDataValue = number[];
