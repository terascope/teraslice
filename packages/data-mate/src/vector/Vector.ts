import {
    DataTypeFieldConfig,
    Maybe, SortOrder,
    ReadonlyDataTypeFields,
} from '@terascope/types';
import {
    isPrimitiveValue, createHashCode,
    HASH_CODE_SYMBOL, getHashCodeFrom
} from '@terascope/utils';
import {
    ReadableData, freezeArray, WritableData
} from '../core';
import {
    DataBuckets, SerializeOptions, VectorType
} from './interfaces';

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
     * @internal
    */
    readonly data: readonly ReadableData<T>[];

    /**
     * If set to false, the Vector is not sortable
    */
    sortable = true;

    /**
     * Returns the number items in the Vector
    */
    readonly size: number;

    #cachedHash?: string|undefined;

    constructor(
        /**
         * This will be set automatically by specific Vector classes
         */
        type: VectorType,
        data: DataBuckets<T>,
        options: VectorOptions
    ) {
        this.type = type;
        this.data = freezeArray(data);
        this.name = options.name;
        this.config = options.config;
        this.childConfig = options.childConfig;
        this.size = this.data.reduce((acc, d) => acc + d.size, 0);
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

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        for (const data of this.data) {
            yield* data;
        }
    }

    /**
     * Iterate over the values and skip the nil ones,
     * returns tuples a with index and value
    */
    * values(): IterableIterator<[index: number, value: T]> {
        let offset = 0;
        for (const data of this.data) {
            for (const [i, v] of data.values) {
                yield [offset + i, v];
            }
            offset += data.size;
        }
    }

    get [HASH_CODE_SYMBOL](): string {
        if (this.#cachedHash) return this.#cachedHash;

        const hash = createHashCode(this.toArray());
        this.#cachedHash = hash;
        return hash;
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
            for (const [index, value] of data.values) {
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
            for (const value of data.values.values()) {
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
    append(data: ReadableData<T>[]|readonly ReadableData<T>[]|ReadableData<T>): Vector<T> {
        return this.fork(this.data.concat(
            Array.isArray(data)
                ? data
                : [data as ReadableData<T>]
        ));
    }

    /**
    *  Add ReadableData to a beginning of the data buckets
    */
    prepend(data: ReadableData<T>[]|readonly ReadableData<T>[]|ReadableData<T>): Vector<T> {
        const preData = Array.isArray(data)
            ? data
            : [data as ReadableData<T>];
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
        return found[0].values.has(found[1]);
    }

    /**
     * Find the Data bucket that holds the value for that
     * bucket
     * @returns the data found and the index of the relative index of value
    */
    findDataWithIndex(index: number): [data:ReadableData<T>, actualIndex: number]|undefined {
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
     * Create a new Vector with the same metadata but with different data
    */
    fork(data: ReadableData<T>[]|readonly ReadableData<T>[]): this {
        const Constructor = this.constructor as {
            new(
                data: ReadableData<T>[]|readonly ReadableData<T>[],
                config: VectorOptions
            ): Vector<T>;
        };
        return new Constructor(data, {
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
            throw new RangeError(`Starting offset of ${start} is out-of-bounds`);
        }

        const endIndex = end < 0 ? this.size + end : end;
        if (endIndex < 0 || endIndex > this.size) {
            throw new RangeError(`Ending offset of ${end} is out-of-bounds`);
        }

        const buckets: ReadableData<T>[] = [];

        let offset = 0;
        for (const data of this.data) {
            const startIndexOfChunk = startIndex - offset;
            if (startIndexOfChunk >= 0 && startIndexOfChunk < data.size) {
                const endIndexOfChunk = endIndex - offset;
                const isEnd = endIndexOfChunk <= data.size;

                buckets.push(new ReadableData(data.slice(
                    startIndexOfChunk,
                    isEnd ? endIndexOfChunk : data.size
                )));

                if (isEnd) break;
            }
            offset += data.size;
        }

        return this.fork(buckets);
    }

    /**
     * Compare two different values on the Vector type.
     * This can be used for equality or sorted.
    */
    compare(a: Maybe<T>, b: Maybe<T>): -1|0|1 {
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
    config: DataTypeFieldConfig|Readonly<DataTypeFieldConfig>;

    /**
     * The type config for any nested fields (currently only works for objects)
    */
    childConfig?: ReadonlyDataTypeFields;

    /**
     * The name of field, if specified this will just be used for metadata
    */
    name?: string;
}
