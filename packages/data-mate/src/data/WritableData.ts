import { Maybe } from '@terascope/types';
import { ReadableDataValue, TypedArray, WritableDataValue } from './interfaces';

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

    /**
     * The total number of values stored
    */
    readonly size: number;

    constructor(
        size: number,
        from: readonly ReadableDataValue<T>[]
    ) {
        this.size = size;
        this.values = new Map(fromToIterable(from));
    }

    /**
     * Set a value for an index
    */
    set(index: number, value: Maybe<T>): WritableData<T> {
        if (value == null) return this;

        const existing = this.values.get(value);
        if (existing) {
            existing.push(index);
        } else {
            this.values.set(value, [index]);
        }
        return this;
    }

    /**
     * Set the same value against multiple indices
    */
    mset(value: Maybe<T>, indices: readonly number[]|TypedArray): WritableData<T> {
        if (value == null) return this;

        const existing = this.values.get(value);
        if (existing) {
            existing.push(...indices);
        } else {
            this.values.set(value, Array.from(indices));
        }
        return this;
    }
}

function* fromToIterable<T>(
    from: readonly ReadableDataValue<T>[],
): Iterable<[T, WritableDataValue]> {
    for (const val of from) {
        yield [val.value, val.indices.slice()];
    }
}
