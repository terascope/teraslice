import {
    DataTypeFieldConfig, Maybe, SortOrder,
    ReadonlyDataTypeFields,
} from '@terascope/types';
import { isPrimitiveValue, getHashCodeFrom } from '@terascope/utils';
import { inspect } from 'node:util';
import { ReadableData, WritableData } from '../core/index.js';
import { DataBuckets, SerializeOptions, VectorType } from './interfaces.js';

/**
 * An immutable typed Array class with a constrained API.
*/
export abstract class Vector<T = unknown> {
    /**
     * Make an instance of a Vector from a config
    */
    static make<R>(
        data: DataBuckets<R>,
        options: VectorOptions
    ): Vector<R> {
        throw new Error(`This is overridden in the index file, ${options} ${data}`);
    }

    /**
     * Sort the values in a Vector and return
     * an array with the updated indices.
    */
    static getSortedIndices(
        sortBy: { vector: Vector<any>; direction: SortOrder }[]
    ): number[] {
        const notSortable = sortBy.find(({ vector }) => !vector.sortable);
        if (notSortable) {
            throw new Error(`Sorting is not supported for ${notSortable.vector?.constructor.name}`);
        }

        const len = sortBy.reduce((size, { vector }) => Math.max(size, vector.size), 0);
        const indices: number[] = Array(len);
        const original: [number, any[]][] = Array(len);

        for (let i = 0; i < len; i++) {
            original[i] = [i, sortBy.map(({ vector }) => vector.get(i))];
        }

        original
            .sort(([, a], [, b]) => (
                sortBy.reduce((acc, { vector, direction: d }, i) => {
                    const res = vector.compare(a[i], b[i]);
                    return acc + (d === 'asc' ? res : -res);
                }, 0)
            ))
            .forEach(([i], newPosition) => {
                indices[i] = newPosition;
            });

        return indices;
    }

    /**
     * The name of field, if specified this will just be used for metadata
    */
    readonly name?: string;

    /**
     * The type of Vector, this should only be set the specific Vector type classes.
    */
    readonly type: VectorType;

    /**
     * The field type configuration
    */
    readonly config: Readonly<DataTypeFieldConfig>;

    /**
     * When Vector is an object type, this will be the data type fields
     * for the object
    */
    readonly childConfig?: ReadonlyDataTypeFields;

    /**
     * A data type agnostic in-memory representation of the data
     * for a Vector and potential indices/unique values. Currently
     * there one ore more data buckets can be used.
     *
     * @note DO NOT MUTATE THESE IT WILL BREAK THE GUARANTEES OF
     *       IMMUTABILITY AND WILL CREATE SIDE EFFECTS BETWEEN
     *       DATA FRAMES
     *
     * @internal
    */
    readonly data: readonly ReadableData<T>[];

    /**
     * If set to false, the Vector is not sortable
    */
    sortable = true;

    /**
     * The cached size of the vector
    */
    private __size: number | undefined;

    /**
     * The cached consistent size of the vector
    */
    private __consistentSize: number | undefined;

    constructor(
        /**
         * This will be set automatically by specific Vector classes
         */
        type: VectorType,
        data: DataBuckets<T>,
        options: VectorOptions
    ) {
        this.type = type;
        const res = getDataBuckets(data);

        this.data = res[0];

        this.__size = res[1];

        this.__consistentSize = res[2];
        this.name = options.name;
        this.config = options.config;
        this.childConfig = options.childConfig;
    }

    /**
     * A function for converting an in-memory representation of
     * a value to an JSON spec compatible format.
    */
    abstract toJSONCompatibleValue?(value: T, options?: SerializeOptions): any;

    /**
    * A function for converting an in-memory representation of
    * a value to an JSON spec compatible format.
    */
    abstract getComparableValue?(value: T): any;

    /**
     * Returns the number items in the Vector
    */
    get size(): number {
        if (this.__size != null) return this.__size;
        this._setSizeAndConsistentSize();
        return this.__size!;
    }

    /**
     * Sometimes when appending data buckets the size
     * is consistent, when that happens we can be
     * much smarter about find the data bucket for a
     * given row, which speeds up some operations
    */
    private get _consistentSize(): number {
        if (this.__consistentSize != null) return this.__consistentSize;
        this._setSizeAndConsistentSize();
        return this.__consistentSize!;
    }

    private _setSizeAndConsistentSize() {
        this.__size = 0;
        let consistentSize: number | undefined;

        for (const bucket of this.data) {
            if (consistentSize == null) {
                consistentSize = bucket.size;
            } else if (consistentSize !== bucket.size) {
                consistentSize = -1;
            }
            this.__size += bucket.size;
        }

        this.__consistentSize = consistentSize ?? -1;
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        for (const data of this.data) {
            yield* data;
        }
    }

    /**
     * Check to see there are any nil values stored in the Vector
    */
    hasNilValues(): boolean {
        return this.data.some((data) => data.hasNilValues());
    }

    /**
     * Get the number of non-nil values in the Vector
    */
    countValues(): number {
        return this.data.reduce((acc, data) => acc + data.countValues(), 0);
    }

    /**
     * Returns true if there are no non-nil values
    */
    isEmpty(): boolean {
        if (this.size === 0) return true;
        return this.data.every((data) => data.isEmpty());
    }

    /**
     * Iterate over the values and skip the nil ones,
     * returns tuples a with index and value
    */
    * values(): IterableIterator<[index: number, value: T]> {
        let offset = 0;
        for (const data of this.data) {
            for (const [i, v] of data.entries()) {
                yield [offset + i, v];
            }
            offset += data.size;
        }
    }

    /**
     * Get the count of distinct values.
     *
     * @note this is O(1) for non-object types and O(n) + extra hashing logic for larger objects
    */
    countUnique(): number {
        let count = 0;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const v of this.unique()) {
            count++;
        }
        return count;
    }

    /**
     * Get the unique values with the index in a tuple form.
     * This is useful for reconstructing an Vector
     * with only the unique values
    */
    * unique(): Iterable<[index: number, value: T]> {
        if (!this.data.length) return;

        const hashes = new Set<any>();
        const getHash = this.data[0].isPrimitive ? (v: unknown) => v : getHashCodeFrom;

        // used to handle index offset between data buckets
        let offset = 0;

        for (const data of this.data) {
            for (const [index, value] of data.entries()) {
                const hash = getHash(value);
                if (!hashes.has(hash)) {
                    hashes.add(hash);
                    yield [offset + index, value];
                }
            }
            offset += data.size;
        }
    }

    /**
    * Get the unique values, excluding nil values.
    * Useful for getting a list of unique values.
    */
    * uniqueValues(): Iterable<T> {
        if (!this.data.length) return;

        const hashes = new Set<any>();
        const getHash = this.data[0].isPrimitive ? (v: unknown) => v : getHashCodeFrom;

        for (const data of this.data) {
            for (const value of data.values()) {
                const hash = getHash(value);
                if (!hashes.has(hash)) {
                    hashes.add(hash);
                    yield value;
                }
            }
        }
    }

    /**
     * Add ReadableData to a end of the data buckets
    */
    append(data: (ReadableData<T>[])|(readonly ReadableData<T>[]) | ReadableData<T>): Vector<T> {
        if (Array.isArray(data)) {
            if (!data.length) return this;
            // Make sure to freeze here so freezeArray doesn't slice the data buckets
            return this.fork(this.data.concat(data));
        }

        const _singleData = data as ReadableData<T>;
        if (_singleData.size === 0) return this;

        return this.fork(this.data.concat([data as ReadableData<T>]));
    }

    /**
    *  Add ReadableData to a beginning of the data buckets
    */
    prepend(data: ReadableData<T>[] | readonly ReadableData<T>[] | ReadableData<T>): Vector<T> {
        const preData = (
            Array.isArray(data)
                ? data
                : [data as ReadableData<T>]
        );

        if (preData.length === 0) return this;

        return this.fork(preData.concat(this.data));
    }

    /**
     * Get value by index
    */
    get(index: number, json?: boolean, options?: SerializeOptions): Maybe<T> {
        const nilValue: any = options?.useNullForUndefined ? null : undefined;

        const found = this.findDataWithIndex(index);
        if (!found) return nilValue;

        const val = found[0].get(found[1]);
        if (val == null) return val ?? nilValue;

        if (!json || !this.toJSONCompatibleValue) {
            return val;
        }

        return this.toJSONCompatibleValue(val as T, options);
    }

    /**
     * Returns true if the value for that index is not nil
    */
    has(index: number): boolean {
        const found = this.findDataWithIndex(index);
        if (!found) return false;
        return found[0].has(found[1]);
    }

    /**
     * Find the Data bucket that holds the value for that
     * bucket
     * @returns the data found and the index of the relative index of value
    */
    findDataWithIndex(index: number): [data: ReadableData<T>, actualIndex: number] | undefined {
        if (index < 0 || this.data.length === 0) return;
        if (this.data.length === 1) {
            if (index + 1 > this.size) return;
            return [this.data[0], index];
        }
        if (this._consistentSize !== -1) {
            return this._findConsistentDataIndex(index);
        }

        // if it on the second half of the data set then use the reverse index way
        if (index > (this.size / 2)) {
            return this._reverseFindDataWithIndex(index);
        }
        return this._forwardFindDataWithIndex(index);
    }

    /**
     * When data buckets all of have the same size we
     * can use an O(1) optimization to find the correct
     * bucket. This helps when there are 1000s of buckets
    */
    private _findConsistentDataIndex(
        index: number
    ): [data: ReadableData<T>, actualIndex: number] | undefined {
        const bucketIndex = Math.floor(index / this._consistentSize);
        const bucket = this.data[bucketIndex];

        if (bucket == null) {
            throw new Error(`Unable to find bucket for ${inspect({
                consistentSize: this._consistentSize,
                bucketIndex,
                index
            })}`);
        }

        return [bucket, index % this._consistentSize];
    }

    /**
     * Find the Data bucket that holds the value for that
     * bucket
    */
    private _forwardFindDataWithIndex(
        index: number
    ): [data: ReadableData<T>, actualIndex: number] | undefined {
        // used to handle index offset between data buckets
        let offset = 0;

        for (const data of this.data) {
            if (index < (data.size + offset)) {
                return [data, index - offset];
            }
            offset += data.size;
        }
    }

    /**
     * Find the Data bucket that holds the value for that
     * bucket this works the in the reverse direction, this
     * will perform better when there are lots of buckets
    */
    private _reverseFindDataWithIndex(
        index: number
    ): [data: ReadableData<T>, actualIndex: number] | undefined {
        // used to handle index offset between data buckets
        let offset = this.size;

        const start = this.data.length - 1;
        for (let i = start; i >= 0; i--) {
            const data = this.data[i];
            offset -= data.size;
            if (index >= offset) {
                return [data, index - offset];
            }
        }
    }

    /**
     * Create a new Vector with the same metadata but with different data
    */
    fork(_data: ReadableData<T>[] | readonly ReadableData<T>[]): this {
        const Constructor = this.constructor as {
            new(
                data: ReadableData<T>[] | readonly ReadableData<T>[],
                config: VectorOptions
            ): Vector<T>;
        };
        return new Constructor(_data, {
            childConfig: this.childConfig,
            config: this.config,
            name: this.name,
        }) as this;
    }

    /**
     * Create a new Vector with the range of values
    */
    slice(start = 0, end = this.size): Vector<T> {
        const startIndex = start < 0 ? this.size + start : start;
        if (startIndex < 0 || startIndex > this.size) {
            throw new RangeError(`Starting offset of ${start} is out-of-bounds, must be >=0 OR <=${this.size}`);
        }

        const endIndex = end < 0 ? this.size + end : end;
        if (endIndex < 0 || endIndex > this.size) {
            throw new RangeError(`Ending offset of ${end} is out-of-bounds, must be >=0 OR <=${this.size}`);
        }

        const returnSize = endIndex - startIndex;
        let bucketIndex = 0;
        let totalProcessed = 0;
        let offset = 0;
        let hasStarted = false;

        const buckets: ReadableData<T>[] = [];

        while (totalProcessed < returnSize) {
            const bucket = this.data[bucketIndex];
            if (bucket == null) break;

            const startIndexInBucket = hasStarted ? 0 : startIndex - offset;
            const endIndexInBucket = Math.min(
                endIndex - offset, bucket.size
            );
            const totalFromBucket = endIndexInBucket - startIndexInBucket;

            if (startIndexInBucket >= 0 && totalFromBucket > 0) {
                const slicedBucket = new ReadableData(bucket.slice(
                    startIndexInBucket,
                    endIndexInBucket
                ));
                buckets.push(slicedBucket);
                hasStarted = true;
                totalProcessed += slicedBucket.size;
            }

            offset += bucket.size;
            bucketIndex++;
        }

        return this.fork(buckets);
    }

    /**
     * Compare two different values on the Vector type.
     * This can be used for equality or sorted.
    */
    compare(a: Maybe<T>, b: Maybe<T>): -1 | 0 | 1 {
        // we need default undefined to null since
        // undefined has inconsistent behavior
        const aVal = this._getComparableValue(a);
        const bVal = this._getComparableValue(b);
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
        return 0;
    }

    private _getComparableValue(value: Maybe<T>): any {
        if (value == null) return null;
        if (this.getComparableValue) {
            return this.getComparableValue(value);
        }

        if (isPrimitiveValue(value)) {
            return value;
        }

        throw new Error('Unable to convert value to number for comparison');
    }

    /**
     * Convert the Vector an array of values (the output is JSON compatible)
    */
    toJSON(options?: SerializeOptions): Maybe<T>[] {
        const res: Maybe<T>[] = Array(this.size);
        for (let i = 0; i < this.size; i++) {
            res[i] = this.get(i, true, options);
        }
        return res;
    }

    /**
     * Convert the Vector to array of values (the in-memory representation of the data)
     * @note may not be JSON spec compatible
    */
    toArray(): Maybe<T>[] {
        const res: Maybe<T>[] = Array(this.size);
        for (let i = 0; i < this.size; i++) {
            res[i] = this.get(i, false) as T;
        }
        return res;
    }

    /**
     * Fork the Data object with specific length.
     *
     * @param size optionally change the size of the Data
    */
    toWritable(size?: number): WritableData<T> {
        return WritableData.make<T>(
            size ?? this.size,
            (index) => this.get(index) as Maybe<T>
        );
    }
}

/**
 * This will get the data buckets with several optimizations when they
 * are either small or there are lots of data buckets
*/
function getDataBuckets<T>(data: DataBuckets<T>): [
    data: DataBuckets<T>, size: number | undefined, consistentSize: number | undefined
] {
    const len = data.length;
    // we the number of data buckets too big it creates too many objects for the
    // garbage collector to clean up
    if (len >= 1000) {
        let size = 0;
        for (let i = 0; i < len; i++) {
            size += data[i].size;
        }

        const writable = new WritableData<T>(size);
        let writeIndex = 0;

        for (let bucketIndex = 0; bucketIndex < len; bucketIndex++) {
            for (const [index, value] of data[bucketIndex].entries()) {
                writable.set(writeIndex + index, value);
            }
            writeIndex += data[bucketIndex].size;
        }

        return [[new ReadableData<T>(writable)], size, -1];
    }

    // this is a little optimization for smaller data lengths
    if (len === 1) {
        return [data, data[0].size, data[0].size];
    }

    // this is a little optimization for smaller data lengths
    if (len <= 10) {
        let size = 0;
        for (let i = 0; i < len; i++) {
            size += data[i].size;
        }
        return [data, size, size === len ? 1 : undefined];
    }

    return [data, undefined, undefined];
}

/**
 * Returns true if the input is a Vector
 */
export function isVector<T>(input: unknown): input is Vector<T> {
    return input instanceof Vector;
}

/**
 * A list of Vector Options
 */
export interface VectorOptions {
    /**
    * The field config
    */
    config: DataTypeFieldConfig | Readonly<DataTypeFieldConfig>;

    /**
     * The type config for any nested fields (currently only works for objects)
    */
    childConfig?: ReadonlyDataTypeFields;

    /**
     * The name of field, if specified this will just be used for metadata
    */
    name?: string;
}
