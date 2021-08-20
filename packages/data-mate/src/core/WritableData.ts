import { getTypeOf, isInteger } from '@terascope/utils';
import type { Maybe, TypedArrayConstructor } from '@terascope/types';
import SparseMap from 'mnemonist/sparse-map';

/**
 * A generic write-only optimized view of data used for Builders.
 * This does not handle updating existing indices, so don't do that.
*/
export class WritableData<T> {
    static emptyData = new WritableData<any>(0);

    /**
     * Create an WritableData with a fixed size
    */
    static make<R>(
        size: number,
        getValue: (index: number) => Maybe<R>,
    ): WritableData<R> {
        const data = new WritableData<R>(size);
        for (let i = 0; i < size; i++) {
            data.set(i, getValue(i));
        }
        return data;
    }

    /**
     * The value to indices Map
    */
    private readonly _values: SparseMap<T>;

    /**
     * The total number of values stored
    */
    readonly size: number;

    constructor(size: number, Values?: TypedArrayConstructor) {
        if (!isInteger(size)) {
            throw new Error(`Invalid size given to WritableData, got ${size} (${getTypeOf(size)})`);
        }

        this._values = Values ? new SparseMap(
            // @ts-expect-error because the types are wrong
            Values, size
        ) : new SparseMap(size);

        this.size = size;
    }

    /**
     * Set a value for an index
    */
    set(index: number, value: Maybe<T>): this {
        if (index >= this.size) {
            throw new RangeError(
                `Index of ${index} is out-of-bounds, must be less than ${this.size}`
            );
        }

        if (value == null) {
            this._values.delete(index);
            return this;
        }

        this._values.set(index, value);
        return this;
    }

    /**
     * Reset the values
    */
    reset(): this {
        this._values.clear();
        return this;
    }

    /**
     * Resize the number of values
    */
    resize(size: number): WritableData<T> {
        if (size === this.size) return this;
        return WritableData.make(
            size,
            this._values.get.bind(this._values)
        );
    }

    rawValues(): SparseMap<T> {
        return this._values;
    }
}
