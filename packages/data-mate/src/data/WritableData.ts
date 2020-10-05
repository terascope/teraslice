import { Maybe } from '@terascope/types';
import { TypedArray, TypedArrayConstructor } from './interfaces';
import { getTypedArrayClass } from './utils';

export type ValueIndices = {
    /**
     * The value index
    */
    index: number;
    /**
     * Indices
    */
    indices: TypedArray;
}

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
     * The value to indices Map
    */
    readonly values: Map<T, ValueIndices>;

    /**
     * A flag to indicate whether the values stored a javascript primitive.
     * For example, boolean, string, symbol, number, bigint, etc.
     * If false the values will require more complicated unique checks
     *
     * @default true
    */
    isPrimitive: boolean;

    readonly size: number;

    /**
     * The correctly sized typed array constructor used for the indices
    */
    readonly PointerArray: TypedArrayConstructor;

    /**
     * The index represent the order of the values,
     * the value is the hash of where to find the index
    */
    readonly indices: TypedArray;

    constructor(size: number) {
        this.size = size;
        this.isPrimitive = true;
        this.PointerArray = getTypedArrayClass(size);
        this.indices = new this.PointerArray(size);
        this.values = new Map();
    }

    /**
     * Set a value for an index
    */
    set(index: number, value: Maybe<T>): WritableData<T> {
        if (value == null) return this;

        const existing = this.values.get(value);
        if (existing) {
            existing.indices = this._appendIndex(
                existing.indices, index, existing.index
            );
        } else {
            const valIndex = this.values.size + 1;
            this.values.set(value, {
                index: valIndex,
                indices: this.PointerArray.of(index)
            });
            this.indices[index] = valIndex;
        }

        return this;
    }

    /**
     * Set the same value against multiple indices
    */
    mset(value: Maybe<T>, indices: TypedArray): WritableData<T> {
        if (value == null) return this;

        const existing = this.values.get(value);
        if (existing) {
            existing.indices = this._concatIndices(
                existing.indices, indices, existing.index
            );
        } else {
            const valIndex = this.values.size + 1;
            this.values.set(value, {
                index: valIndex,
                indices: this.PointerArray.from(indices, (v) => {
                    this.indices[v] = valIndex;
                    return v;
                })
            });
        }
        return this;
    }

    private _appendIndex(existing: TypedArray, index: number, valIndex: number): TypedArray {
        const indices = new this.PointerArray(existing.length + 1);
        indices.set(existing, 0);
        indices[existing.length] = index;
        this.indices[index] = valIndex;
        return indices;
    }

    private _concatIndices(
        existing: TypedArray,
        indices: TypedArray,
        valIndex: number
    ): TypedArray {
        const result = new this.PointerArray(existing.length + 1);
        result.set(existing, 0);
        result.set(this.PointerArray.from(indices, (v) => {
            this.indices[v] = valIndex;
            return v;
        }), existing.length);
        return result;
    }
}
