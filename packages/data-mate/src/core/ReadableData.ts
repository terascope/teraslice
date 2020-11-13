import { Maybe } from '@terascope/types';
import { ReadableDataValue, TypedArray, WritableDataValue } from './interfaces';
import { getTypedArrayClass, getHashCodeFrom } from './utils';
import { WritableData } from './WritableData';

const _indicesCache = new WeakMap<ReadableData<any>, TypedArray>();

/**
 * A generic readonly optimized view of data used for Vectors.
*/
export class ReadableData<T> {
    /**
     * The values to value index lookup table
    */
    readonly values: readonly ReadableDataValue<T>[];

    /**
     * The number of total number of values stored
    */
    readonly size: number;

    /**
     * A flag to indicate whether the values stored a javascript primitive.
     * For example, boolean, string, symbol, number, bigint, etc.
     * If false the values will require more complicated unique checks
     *
     * @default true
    */
    readonly isPrimitive: boolean;

    constructor(data: WritableData<T>) {
        this.values = Array.from(data.values, fromValue);
        this.size = data.size;
        this.isPrimitive = this.values.length
            ? typeof this.values[0].v !== 'object'
            : true;
        Object.freeze(this);
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        for (const valIndex of this.indices) {
            if (valIndex === 0) yield null;
            else yield this.values[valIndex - 1].v;
        }
    }

    /**
     * Iterate over the null indices the null indices
    */
    * nullIndices(): Iterable<number> {
        // eslint-disable-next-line prefer-destructuring
        const indices = this.indices;
        for (let i = 0; i < this.size; i++) {
            const valIndex = indices[i];
            if (valIndex === 0) yield i;
        }
    }

    /**
     * The index represent the order of the values,
     * the value is the hash of where to find the index
     *
     * @note this is O(n) on the first call
    */
    get indices(): TypedArray {
        const cached = _indicesCache.get(this);
        if (cached) return cached;

        const indices = generateIndices(this.values, this.size);
        _indicesCache.set(this, indices);
        return indices;
    }

    /**
     * Get a value by an index
    */
    get(index: number): Maybe<T> {
        const valueIndex = this.indices[index];
        if (valueIndex === undefined) return undefined;
        if (valueIndex === 0) return null;

        return this.values[valueIndex - 1].v;
    }

    /**
     * Get the count of distinct values.
     *
     * @note this is O(1) for non-object types and O(n) + extra hashing logic for larger objects
    */
    countUnique(): number {
        if (this.isPrimitive) {
            return this.values.length;
        }
        return new Set(this.unique()).size;
    }

    /**
     * An iterable of the unique values
    */
    * unique(): Iterable<T> {
        if (this.isPrimitive) {
            for (const val of this.values) {
                yield val.v;
            }
            return;
        }

        const hashes = new Set<string>();
        for (const val of this.values) {
            const hash = getHashCodeFrom(val.v);
            if (!hashes.has(hash)) {
                hashes.add(hash);
                yield val.v;
            }
        }
    }

    /**
     * Fork the Data object with specific length.
     *
     * @param size optionally change the size of the Data
    */
    toWritable(size = this.size): WritableData<T> {
        if (size < this.size) {
            return new WritableData<T>(
                this.size, this.values
            ).resize(size);
        }

        return new WritableData<T>(size, this.values);
    }

    /**
     * Create a new Data with the range of values
    */
    slice(start = 0, end = this.size): WritableData<T> {
        if (start === 0 && end === this.size) {
            return this.toWritable();
        }
        const indices = this.indices.slice(start, end);

        const data = WritableData.make<T>(indices.length);

        let currentIndex = 0;
        for (const index of indices) {
            const val = index === 0 ? null : this.values[index - 1].v;
            data.set(currentIndex++, val);
        }

        return data;
    }

    [Symbol.for('nodejs.util.inspect.custom')](): any {
        const proxy = {
            size: this.size,
            isPrimitive: this.isPrimitive,
            indices: this.indices,
            values: this.values
        };

        // Trick so that node displays the name of the constructor
        Object.defineProperty(proxy, 'constructor', {
            value: ReadableData,
            enumerable: false
        });

        return proxy;
    }
}

function fromValue<T>([value, indices]: [T, WritableDataValue]): ReadableDataValue<T> {
    return {
        v: value,
        i: indices,
    };
}

function generateIndices<T>(values: readonly ReadableDataValue<T>[], size: number): TypedArray {
    // since 0 is always null we need to add one to the values length
    const PointerArray = getTypedArrayClass(values.length + 1);
    const indices = new PointerArray(size);

    const len = values.length;
    for (let i = 0; i < len; i++) {
        setValIndices(indices, values[i].i, i + 1);
    }

    return indices;
}

function setValIndices(
    indices: TypedArray,
    valIndices: readonly number[],
    valIndex: number
): void {
    const len = valIndices.length;
    for (let i = 0; i < len; i++) {
        indices[valIndices[i]] = valIndex;
    }
}
