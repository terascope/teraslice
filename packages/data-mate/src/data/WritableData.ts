import { Maybe } from '@terascope/types';
import { ReadableDataValue, TypedArray, WritableDataValue } from './interfaces';
import { getPointerArray } from './utils';

/**
 * A data type agnostic in-memory representation of the data
 * for a Vector and indices/unique values.
 *
 * This is usually made in the Builder and then
 * frozen before handing it to the Vector.
 *
 * @internal
*/
export class WritableData<T> {
    /**
     * Create an WritableData with a fixed size
    */
    static make<R>(size: number): WritableData<R> {
        return new WritableData(size, []);
    }

    /**
     * The index represent the order of the values,
     * the value is the hash of where to find the index
    */
    readonly indices: TypedArray;

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
        this.indices = getPointerArray(size);
        this.values = new Map(fromToIterable(from, this.indices));
    }

    /**
     * Set a value for an index
    */
    set(index: number, value: Maybe<T>): WritableData<T> {
        if (value == null) return this;

        const existing = this.values.get(value);
        if (existing) {
            existing.indices.push(index);
        } else {
            const valIndex = this.values.size + 1;
            this.values.set(value, {
                index: valIndex,
                indices: [index],
            });
            this.indices[index] = valIndex;
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
            for (const index of indices) {
                this.indices[index] = existing.index;
                existing.indices.push(index);
            }
        } else {
            const valIndex = this.values.size + 1;
            this.values.set(value, {
                index: valIndex,
                indices: Array.from(indices, (v) => {
                    this.indices[v] = valIndex;
                    return v;
                })
            });
        }
        return this;
    }
}

function* fromToIterable<T>(
    from: readonly ReadableDataValue<T>[],
    indices: TypedArray,
): Iterable<[T, WritableDataValue]> {
    const size = from.length;
    for (let i = 0; i < size; i++) {
        const val = from[i];
        const index = i + 1;
        yield [val.value, {
            index,
            indices: Array.from(val.indices, (v) => {
                indices[v] = index;
                return v;
            }),
        }];
    }
}
