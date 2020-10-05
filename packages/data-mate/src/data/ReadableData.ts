import { Maybe } from '@terascope/types';
import { getHashCodeFrom } from '../core-utils/data-helpers';
import { TypedArray } from './interfaces';
import { ValueIndices, WritableData } from './WritableData';

type ValueEntry<T> = Readonly<{
    indices: TypedArray;
    value: T;
}>;

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
    readonly values: readonly ValueEntry<T>[];

    /**
    * A flag to indicate whether the values stored a javascript primitive.
    * For example, boolean, string, symbol, number, bigint, etc.
    * If false the values will require more complicated unique checks
    *
    * @default true
   */
    isPrimitive: boolean;

    constructor(data: WritableData<T>) {
        this.isPrimitive = data.isPrimitive;
        this.indices = data.indices;
        this.values = Object.freeze(
            Array.from(data.values, getValueEntry)
        );
        Object.freeze(this);
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
        return new Set(this.getValuePrimitives()).size;
    }

    /**
     * Fork the Data object with specific length.
    */
    toWritable(length = this.size): WritableData<T> {
        if (length < this.size) {
            throw new Error('ReadableData.toWritable doesn\'t support decreasing the number of values');
        }
        const data = new WritableData<T>(length);
        data.isPrimitive = this.isPrimitive;
        for (const val of this.values) {
            data.mset(val.value, val.indices);
        }
        return data;
    }

    /**
     * Create a new Data with the range of values
    */
    slice(start?: number, end?: number): WritableData<T> {
        const indices = this.indices.slice(start, end);

        const data = new WritableData<T>(indices.length);
        data.isPrimitive = this.isPrimitive;

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
    * getValuePrimitives(): Iterable<any> {
        if (this.isPrimitive) {
            yield* this;
            return;
        }

        for (const { value } of this.values) {
            yield getHashCodeFrom(value);
        }
    }
}

function getValueEntry<T>([value, { indices }]: [T, ValueIndices]): ValueEntry<T> {
    return {
        value,
        indices,
    };
}
