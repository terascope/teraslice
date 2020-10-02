import { Maybe } from '@terascope/types';
import { getHashCodeFrom } from './data-helpers';

/**
 * A data type agnostic in-memory representation of the data
 * for a Vector and indices/unique values.
 *
 * This is usually made in the Builder and then
 * frozen before handing it to the Vector.
 *
 * @internal
*/
export class Data<T> {
    /**
     * The index represent the order of the values,
     * the value is the hash of where to find the index
    */
    readonly indices: TypedArray|number[];

    /**
     * The unique values
    */
    readonly values: T[];

    /**
     * The number of null values
    */
    nulls: number;

    /**
     * If false, the values might duplicate references to the same object
    */
    isNaturallyDistinct: boolean;

    constructor(
        size: number,
        _data?: Data<T>,
    ) {
        if (_data) {
            this.isNaturallyDistinct = _data.isNaturallyDistinct;
            this.indices = getTypedPointerArray(size);
            this.indices.set(_data.indices, 0);
            this.values = _data.values.slice();
            this.nulls = _data.nulls;
        } else {
            this.isNaturallyDistinct = true;
            this.indices = getTypedPointerArray(size);
            this.values = [];
            this.nulls = 0;
        }
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        for (const valIndex of this.indices) {
            if (valIndex === 0) yield null;
            else yield this.values[valIndex - 1];
        }
    }

    get size(): number {
        return this.indices.length;
    }

    get isFrozen(): boolean {
        return Object.isFrozen(this);
    }

    /**
     * Get a tuple of indices to values (unordered)
    */
    * associations(): IterableIterator<[
        value: Maybe<T>,
        indices: readonly number[],
    ]> {
        const [reversed, nulls] = this.getValueIndices();
        const len = reversed.length;

        for (let i = 0; i < len; i++) {
            yield [this.values[i], reversed[i]];
        }

        if (nulls.length) {
            yield [null, nulls];
        }
    }

    /**
     * Set a value for an index
    */
    set(index: number, value: Maybe<T>): Data<T> {
        this.mset([index], value);
        return this;
    }

    /**
     * Set the same value against multiple indices
    */
    mset(indices: number[]|readonly number[], value: Maybe<T>): Data<T> {
        if (this.isFrozen) {
            throw new Error('Cannot write to frozen Data instance');
        }

        if (value == null) {
            for (const index of indices) {
                this.indices[index] = 0;
            }
            this.nulls += indices.length;
            return this;
        }

        const existingIndex = this.values.indexOf(value);
        let valIndex: number;
        if (existingIndex === -1) {
            valIndex = this.values.push(value);
        } else {
            valIndex = existingIndex + 1;
        }
        for (const index of indices) {
            this.indices[index] = valIndex;
        }
        return this;
    }

    /**
     * Get a value by an index
    */
    get(index: number): Maybe<T> {
        const valueIndex = this.indices[index];
        if (valueIndex === undefined) return undefined;
        if (valueIndex === 0) return null;

        const value = this.values[valueIndex - 1];
        if (value == null) {
            throw Error(`Value in Data not found for index ${index}`);
        }
        return value;
    }

    /**
     * Get the distinct values.
     *
     * @note this is can be expensive for non-primitive values, like objects
    */
    distinct(): number {
        if (this.isNaturallyDistinct) {
            return this.values.length;
        }
        const hashes = new Set<string>();
        for (const val of this.values) {
            hashes.add(getHashCodeFrom(val));
        }
        return hashes.size;
    }

    /**
     * Freeze the Data object so cannot be mutated
    */
    freeze(): Data<T> {
        if (this.isFrozen) return this;

        Object.freeze(this);
        Object.freeze(this.values);
        return this;
    }

    /**
     * Fork the Data object with specific length.
     *
     * The result Data object will not be frozen
    */
    fork(length = this.size): Data<T> {
        if (length < this.size) {
            throw new Error('Data.fork doesn\'t support decreasing the number of values');
        }
        return new Data<T>(length, this);
    }

    /**
     * Create a new Data with the range of values
     *
     * The result Data object will not be frozen
    */
    slice(start?: number, end?: number): Data<T> {
        const indices = this.indices.slice(start, end);

        const data = new Data<T>(indices.length);
        data.isNaturallyDistinct = this.isNaturallyDistinct;

        let currentIndex = 0;
        for (const index of indices) {
            if (index === 0) {
                data.set(currentIndex++, null);
            } else {
                const val = this.values[index - 1];
                data.set(currentIndex++, val);
            }
        }

        return data;
    }

    /**
     * Create an array of value index -> position indices
    */
    getValueIndices(): [reversed: (number[])[], nulls: number[]] {
        const len = this.indices.length;

        const reversed: (number[])[] = Array(this.values.length);
        const nulls = Array(this.nulls);

        let n = 0;
        for (let i = 0; i < len; i++) {
            const valIndex = this.indices[i];
            if (valIndex !== 0) {
                (reversed[valIndex - 1] ??= []).push(i);
            } else {
                nulls[n++] = i;
            }
        }

        return [reversed, nulls];
    }
}

export type TypedArray = Uint8Array
|Uint16Array
|Uint32Array
|Float64Array;

export type TypedArrayConstructor = Uint8ArrayConstructor
|Uint16ArrayConstructor
|Uint32ArrayConstructor
|Float64ArrayConstructor;

const MAX_8BIT_INT = (2 ** 8) - 1;
const MAX_16BIT_INT = (2 ** 16) - 1;
const MAX_32BIT_INT = (2 ** 32) - 1;

/**
 * Gets the correctly sized TypeArray depending on the length of items
 */
export function getTypedPointerArray(size: number): TypedArray {
    const maxIndex = size - 1;

    if (maxIndex <= MAX_8BIT_INT) return new Uint8Array(size);

    if (maxIndex <= MAX_16BIT_INT) return new Uint16Array(size);

    if (maxIndex <= MAX_32BIT_INT) return new Uint32Array(size);

    return new Float64Array(size);
}
