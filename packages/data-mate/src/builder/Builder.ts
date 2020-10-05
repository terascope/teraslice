import { DataTypeFieldConfig, DataTypeFields } from '@terascope/types';
import { ReadableData, WritableData, TypedArray } from '../data';
import {
    Vector, VectorType
} from '../vector';

/**
 * Since Vectors are immutable, a Builder can be to construct a
 * Vector. When values are inserted they are coerced and validated.
*/
export abstract class Builder<T = unknown> {
    /**
     * Make a instance of a Builder from a DataTypeField config
    */
    static make<R = unknown>(
        config: DataTypeFieldConfig,
        data: WritableData<R>,
        childConfig?: DataTypeFields,
    ): Builder<R> {
        throw new Error(
            `This will functionality replaced in the index file
            ${config} ${length} ${childConfig}`
        );
    }

    /**
     * Convert a Vector to a Builder with current values
     * populated depending on the length populated
    */
    static makeFromVector<R>(
        vector: Vector<R>,
        size: number,
    ): Builder<R> {
        const data = vector.data.toWritable(size);
        const builder = Builder.make<R>(
            vector.config,
            data,
            vector.childConfig,
        );
        builder.currentIndex = vector.data.size;
        return builder;
    }

    /**
     * The type of Vector, this should only be set the specific Vector type classes.
    */
    readonly type: VectorType;

    /**
     * The field type configuration
    */
    readonly config: DataTypeFieldConfig;

    /**
     * A function for converting a value to an JSON spec compatible format.
     * This is specific on the vector type classes via a static method usually.
    */
    readonly valueFrom?: ValueFromFn<T>;

    /**
     * When Vector is an object type, this will be the data type fields
     * for the object
    */
    readonly childConfig?: DataTypeFields;

    /**
     * @internal
    */
    readonly data: WritableData<T>;

    /**
     * The current insertion index (used for append)
    */
    currentIndex: number;

    constructor(
        /**
         * This will be set automatically by specific Builder classes
         */
        type: VectorType,
        data: WritableData<T>,
        {
            config, valueFrom, childConfig
        }: BuilderOptions<T>,
    ) {
        this.type = type;
        this.config = { ...config };
        this.valueFrom = valueFrom;
        this.childConfig = childConfig ? { ...childConfig } : undefined;
        this.data = data;
        this.currentIndex = 0;
    }

    /**
     * Set value by index
    */
    set(index: number, value: unknown): Builder<T> {
        const val = this._valueFrom(value);
        this.data.set(index, val);
        return this;
    }

    /**
     * Set a single unique value on multiple indices
    */
    mset(value: unknown, indices: readonly number[]|TypedArray): Builder<T> {
        const val = this._valueFrom(value);
        this.data.mset(val, indices);
        return this;
    }

    /**
     * Append a value to the end
    */
    append(value: unknown): Builder<T> {
        return this.set(this.currentIndex++, value);
    }

    /**
     * Flush and convert the result to a Vector
    */
    toVector(): Vector<T> {
        const vector = Vector.make(
            Object.freeze(this.config),
            new ReadableData(this.data),
            this.childConfig
        );

        // @ts-expect-error
        this.data = undefined;
        this.currentIndex = -1;
        return vector;
    }

    _valueFrom(value: unknown): T|null {
        if (value == null) return null;
        if (!this.valueFrom) return value as T;
        return this.valueFrom(value, this);
    }
}

/**
 * Returns true if the input is a Builder
 */
export function isBuilder<T>(input: unknown): input is Builder<T> {
    return input instanceof Builder;
}

/**
 * Coerce a value so it can be stored in the builder
*/
export type ValueFromFn<T> = (
    value: unknown,
    thisArg: Builder<T>,
) => T;

/**
 * A list of Builder Options
 */
export interface BuilderOptions<T> {
    config: DataTypeFieldConfig;

    valueFrom?: ValueFromFn<T>;
    /**
     * The type config for any nested fields (currently only works for objects)
    */
    childConfig?: DataTypeFields;
}
