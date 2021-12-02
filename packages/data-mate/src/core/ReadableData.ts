import { Maybe } from '@terascope/types';
import {
    ReadonlySparseMap
} from './interfaces';
import { WritableData } from './WritableData';

/**
 * A generic readonly optimized view of data used for Vectors.
*/
export class ReadableData<T> implements Iterable<Maybe<T>> {
    static emptyData = new ReadableData<any>(WritableData.emptyData);

    /**
     * The values to value index lookup table
    */
    private readonly _values!: ReadonlySparseMap<T>;

    /**
     * The number of total number of values stored
    */
    readonly size!: number;

    constructor(data: WritableData<T>) {
        // freezing this is very important because it allows the
        // raw values to be used without fully copying them
        Object.defineProperty(this, '_values', {
            value: Object.freeze(data.rawValues()),
            enumerable: true,
            writable: false
        });

        Object.defineProperty(this, 'size', {
            value: data.size,
            enumerable: true,
            writable: false
        });
    }

    /**
     * A flag to indicate whether the values stored a javascript primitive.
     * For example, boolean, string, symbol, number, bigint, etc.
     * If false the values will require more complicated unique checks
     *
     * @default true
    */
    get isPrimitive() {
        return isPrimitive(this._values);
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        for (let i = 0; i < this.size; i++) {
            yield this.get(i);
        }
    }

    /**
     * Iterate over the non-nil values
    */
    values(): Iterable<T> {
        return this._values.values();
    }

    /**
     * Iterate over the non-nil values with indices
    */
    entries(): Iterable<[index: number, value: T]> {
        return this._values;
    }

    /**
     * Get a value by an index
    */
    get(index: number): Maybe<T> {
        return this._values.get(index) ?? null;
    }

    /**
     * Check if the contains a particular value
    */
    has(index: number): boolean {
        return this._values.has(index);
    }

    /**
     * Fork the Data object with specific length.
     *
     * @param size optionally change the size of the Data
    */
    toWritable(size?: number): WritableData<T> {
        return WritableData.make<T>(
            size ?? this.size,
            this._values.get.bind(this._values)
        );
    }

    /**
     * Create a new Data with the range of values
    */
    slice(start = 0, end = this.size): WritableData<T> {
        // this is the simple case
        if (start === 0 && end >= 0) {
            return this.toWritable(end);
        }

        const startIndex = start < 0 ? this.size + start : start;
        if (startIndex < 0 || startIndex > this.size) {
            throw new RangeError(`Starting offset of ${start} is out-of-bounds, must be >=0 OR <=${this.size}`);
        }

        const endIndex = end < 0 ? this.size + end : end;
        if (endIndex < 0 || endIndex > this.size) {
            throw new RangeError(`Ending offset of ${end} is out-of-bounds, must be >=0 OR <=${this.size}`);
        }

        const data = new WritableData<T>(endIndex - startIndex);

        let writeIndex = 0;
        for (let i = startIndex; i < endIndex; i++) {
            const val = this.get(i);
            data.set(writeIndex++, val);
        }

        return data;
    }

    /**
     * Check to see there are any nil values stored
    */
    hasNilValues(): boolean {
        return this.countValues() !== this.size;
    }

    /**
     * Get the number of non-nil values
    */
    countValues(): number {
        return this._values.size;
    }

    /**
     * Returns true if there are no non-nil values
    */
    isEmpty(): boolean {
        return this.size === 0 || this.countValues() === 0;
    }
}

function isPrimitive(values: ReadonlySparseMap<any>): boolean {
    if (!values.size) return true;
    // @ts-expect-error
    const val = values.vals[0];
    return typeof val !== 'object';
}
