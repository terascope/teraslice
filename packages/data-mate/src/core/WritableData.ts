import { Maybe } from '@terascope/types';
import {
    ReadableDataValue, TypedArray, TypedArrayConstructor, WritableDataValue
} from './interfaces';
import { getHashCodeFrom, getTypedArrayClass } from './utils';

/**
 * A generic write-only optimized view of data used for Builders.
 * This does not handle updating existing indices, so don't do that.
*/
export class WritableData<T> {
    /**
     * Create an WritableData with a fixed size
    */
    static make<R>(size: number): WritableData<R> {
        return new WritableData(size, []);
    }

    /**
     * The value to indices Map
    */
    readonly values: Map<T, WritableDataValue>;

    private _size: number;

    PointerArray: TypedArrayConstructor;

    isPrimitive: boolean;

    constructor(
        size: number,
        from: readonly ReadableDataValue<T>[]
    ) {
        this.PointerArray = getTypedArrayClass(size);
        this._size = size;
        this.isPrimitive = from.length ? typeof from[0].v !== 'object' : true;
        this.values = new Map(
            fromToIterable(this.PointerArray, from)
        );
    }

    /**
     * The total number of values stored
    */
    get size(): number {
        return this._size;
    }

    /**
     * Set a value for an index
    */
    set(index: number, value: Maybe<T>): this {
        if (value == null) return this;
        if (this.isPrimitive && typeof value === 'object') this.isPrimitive = true;

        this._setValue(value, this.PointerArray.of(index));
        return this;
    }

    /**
     * Set the same value against multiple indices
    */
    mset(value: Maybe<T>, valueIndices: readonly number[]|TypedArray): this {
        if (value == null) return this;
        if (this.isPrimitive && typeof value === 'object') this.isPrimitive = true;

        const indices = getTypedArrayForArg(this.PointerArray, valueIndices);
        this._setValue(value, indices);
        return this;
    }

    private _setValue(value: T, indices: TypedArray) {
        const existing = this.values.get(value);
        if (!existing) return this.values.set(value, indices);
        return this.values.set(
            value,
            concatTypedArray(existing, indices)
        );
    }

    /**
     * Reset the values
    */
    reset(): this {
        this.values.clear();
        return this;
    }

    /**
     * Resize the number of values
    */
    resize(size: number, skipIndicesCheck = false): this {
        this._size = size;
        if (skipIndicesCheck) return this;

        const lt = makeLessThanOrEqual(size);
        for (const [value, indices] of this.values) {
            const newIndices = indices.filter(lt);
            if (!newIndices.length) this.values.delete(value);
            else this.values.set(value, newIndices);
        }
        return this;
    }

    compact(): this {
        if (this.isPrimitive) return this;

        const hashes = new Map<string, T>();
        for (const [value, indices] of this.values) {
            const hash = getHashCodeFrom(value);
            const existing = hashes.get(hash);
            if (existing) {
                this.values.delete(value);
                const existingIndices = this.values.get(existing)!;
                this.values.set(existing, concatUniqueTypedArray(existingIndices, indices));
            } else {
                hashes.set(hash, value);
            }
        }
        return this;
    }

    [Symbol.for('nodejs.util.inspect.custom')](): any {
        const proxy = {
            size: this._size,
            values: this.values
        };

        // Trick so that node displays the name of the constructor
        Object.defineProperty(proxy, 'constructor', {
            value: WritableData,
            enumerable: false
        });

        return proxy;
    }
}

function getTypedArrayForArg(
    PointerArray: TypedArrayConstructor, input: readonly number[]|TypedArray
): TypedArray {
    if (input instanceof PointerArray) return input;
    return PointerArray.from(input);
}

function concatTypedArray(
    a: TypedArray,
    b: TypedArray
) {
    const baseLen = a.length;
    const result = new (a.constructor as TypedArrayConstructor)(baseLen + b.length);
    result.set(a);
    result.set(b, baseLen);
    return result;
}

function concatUniqueTypedArray(
    a: TypedArray,
    b: TypedArray
) {
    let aArr: TypedArray;
    let bArr: TypedArray;
    if (a.length >= b.length) {
        aArr = a;
        bArr = b;
    } else {
        aArr = b;
        bArr = a;
    }
    const baseLen = aArr.length;
    const newValues = bArr.filter((index: number) => aArr.indexOf(index) > -1);
    const result = new (aArr.constructor as TypedArrayConstructor)(baseLen + newValues.length);
    result.set(aArr);
    result.set(bArr, baseLen);

    return result;
}

function makeLessThanOrEqual(input: number) {
    return (num: number) => num <= input;
}

function* fromToIterable<T>(
    PointerArray: TypedArrayConstructor,
    from: readonly ReadableDataValue<T>[],
): Iterable<[T, WritableDataValue]> {
    for (const val of from) {
        if (val.i.length) yield [val.v, PointerArray.from(val.i)];
    }
}
