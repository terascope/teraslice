import { Maybe } from '@terascope/types';
import { getHashCodeFrom } from '../core-utils/data-helpers';
import { ReadableDataValue, TypedArray, WritableDataValue } from './interfaces';
import { getTypedArrayClass } from './utils';
import { WritableData } from './WritableData';

/**
 * A data type agnostic in-memory representation of the data
 * for a Vector and indices/unique values.
 *
 * This is usually made in the Builder and then
 * frozen before handing it to the Vector.
 *
 * @internal
*/
export class ReadableData<T> {
    /**
     * The index represent the order of the values,
     * the value is the hash of where to find the index
    */
    readonly indices: TypedArray;

    /**
     * The values to value index lookup table
    */
    readonly values: readonly ReadableDataValue<T>[];

    constructor(data: WritableData<T>) {
        const PointerArray = getTypedArrayClass(data.values.size + 1);
        this.indices = PointerArray.from(data.indices);
        this.values = Array.from(data.values, fromValue);
        Object.freeze(this);
    }

    /**
    * A flag to indicate whether the values stored a javascript primitive.
    * For example, boolean, string, symbol, number, bigint, etc.
    * If false the values will require more complicated unique checks
    *
    * @default true
    */
    get isPrimitive(): boolean {
        const [val] = this.values;
        if (val == null) return true;
        return typeof val.value !== 'object';
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        for (const valIndex of this.indices) {
            if (valIndex === 0) yield null;
            else yield this.values[valIndex - 1].value;
        }
    }

    get size(): number {
        return this.indices.length;
    }

    /**
     * Get a value by an index
    */
    get(index: number): Maybe<T> {
        const valueIndex = this.indices[index];
        if (valueIndex === undefined) return undefined;
        if (valueIndex === 0) return null;

        return this.values[valueIndex - 1].value;
    }

    /**
     * Get the distinct values.
     *
     * @note this is can be expensive for non-primitive values, like objects
    */
    distinct(): number {
        if (this.isPrimitive) {
            return this.values.length;
        }
        return new Set(this.getValuePrimitivesOrHash()).size;
    }

    /**
     * Fork the Data object with specific length.
     *
     * @param size optionally increase the size of the Data
    */
    toWritable(size = this.size): WritableData<T> {
        if (size < this.size) {
            throw new Error('ReadableData.toWritable doesn\'t support decreasing the number of values');
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
            const val = index === 0 ? null : this.values[index - 1].value;
            data.set(currentIndex++, val);
        }

        return data;
    }

    /**
     * Get an iterable for getting the primitive values
    */
    * getValuePrimitivesOrHash(): Iterable<any> {
        if (this.isPrimitive) {
            yield* this;
            return;
        }

        for (const { value } of this.values) {
            yield getHashCodeFrom(value);
        }
    }
}

function fromValue<T>([value, { indices }]: [T, WritableDataValue]): ReadableDataValue<T> {
    return {
        value,
        indices,
    };
}
