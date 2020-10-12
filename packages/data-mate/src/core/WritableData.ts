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

    private _size: number;

    constructor(
        size: number,
        from: readonly ReadableDataValue<T>[]
    ) {
        this._size = size;
        this.values = new Map(fromToIterable(from));
    }

    /**
     * The total number of values stored
    */
    get size(): number {
        return this._size;
    }

    /**
     * Set a value for an index
    */
    set(index: number, value: Maybe<T>): this {
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
    mset(value: Maybe<T>, indices: readonly number[]|TypedArray): this {
        if (value == null) return this;

        const existing = this.values.get(value);
        if (existing) {
            existing.push(...indices);
        } else {
            this.values.set(value, Array.from(indices));
        }
        return this;
    }

    /**
     * Reset the values
    */
    reset(): this {
        this.values.clear();
        return this;
    }

    /**
     * Resize the number of values
    */
    resize(size: number, skipIndicesCheck = false): this {
        this._size = size;
        if (skipIndicesCheck) return this;

        const gt = makeGreaterThan(size);
        for (const [value, indices] of this.values) {
            const newIndices = indices.filter(gt);
            if (!newIndices.length) this.values.delete(value);
            else this.values.set(value, newIndices);
        }
        return this;
    }
}

function makeGreaterThan(input: number) {
    return (num: number) => num > input;
}

function* fromToIterable<T>(
    from: readonly ReadableDataValue<T>[],
): Iterable<[T, WritableDataValue]> {
    for (const val of from) {
        if (val.i.length) yield [val.v, val.i.slice()];
    }
}
