import { Maybe } from '@terascope/types';
import SparseMap from 'mnemonist/sparse-map';
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
    readonly values: ReadonlySparseMap<T>;

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
        this.values = Object.freeze(data.values) as any;
        this.size = data.size;
        this.isPrimitive = isPrimitive(data.values);
        Object.freeze(this);
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        for (let i = 0; i < this.size; i++) {
            yield this.values.get(i) ?? null;
        }
    }

    /**
     * Get a value by an index
    */
    get(index: number): Maybe<T> {
        return this.values.get(index) ?? null;
    }

    /**
     * Fork the Data object with specific length.
     *
     * @param size optionally change the size of the Data
    */
    toWritable(size?: number): WritableData<T> {
        return WritableData.make<T>(
            size ?? this.size,
            this.values.get.bind(this.values)
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
            throw new RangeError(`Starting offset of ${start} is out-of-bounds`);
        }

        const endIndex = end < 0 ? this.size + end : end;
        if (endIndex < 0 || endIndex > this.size) {
            throw new RangeError(`Ending offset of ${end} is out-of-bounds`);
        }

        const data = new WritableData<T>(endIndex - startIndex);

        let writeIndex = 0;
        for (let i = startIndex; i < endIndex; i++) {
            const val = this.values.get(i);
            data.set(writeIndex++, val);
        }

        return data;
    }

    /**
     * Get the internal values list do not mutate it
    */
    get _values(): readonly T[] {
        return [...this.values.values()];
    }
}

function isPrimitive(values: SparseMap<any>): boolean {
    if (!values.size) return true;
    // @ts-expect-error
    const val = values.vals[0];
    return typeof val !== 'object';
}
