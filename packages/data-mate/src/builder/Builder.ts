import { DataTypeFieldConfig, DataTypeFields } from '@terascope/types';
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
        length?: number,
        childConfig?: DataTypeFields
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
        length: number
    ): Builder<R> {
        if (length == null) {
            throw new Error('Builder.makeFromVector requires a length');
        }

        const builder = Builder.make<R>(
            vector.config,
            length,
            vector.childConfig
        );

        const { data } = vector.slice(0, length);
        // @ts-expect-error
        builder.values = data.values.slice();
        // @ts-expect-error
        builder.indices = data.indices.slice();
        builder.nullCount = data.nullCount;
        builder.currentIndex = vector.size;
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
     * The real index to values index lookup
     *
     * @internal
    */
    readonly indices: number[];

    /**
    * The unique values
    *
    * @internal
   */
    readonly values: T[];

    /**
    * The number of null values
    *
    * @internal
   */
    nullCount: number;

    /**
     * The current insertion index (used for append)
    */
    currentIndex = 0;

    constructor(
        /**
         * This will be set automatically by specific Builder classes
         */
        type: VectorType,
        {
            config, length, valueFrom, childConfig
        }: BuilderOptions<T>
    ) {
        this.type = type;
        this.config = { ...config };
        this.valueFrom = valueFrom;
        this.childConfig = childConfig ? { ...childConfig } : undefined;
        this.values = [];
        this.indices = length != null ? Array(length) : [];
        this.nullCount = 0;
    }

    /**
     * Returns the number items in the Builder
    */
    get size(): number {
        return this.values.length;
    }

    /**
     * Set value by index
    */
    set(index: number, value: unknown): Builder<T> {
        if (value == null) {
            this.indices[index] = -1;
            this.nullCount++;
        } else {
            const val = (
                this.valueFrom ? this.valueFrom(value, this) : value
            ) as T;
            const valIndex = this.values.indexOf(val);
            if (valIndex === -1) {
                const newValueIndex = this.values.push(val) - 1;
                this.indices[index] = newValueIndex;
            } else {
                this.indices[index] = valIndex;
            }
        }
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
        const vector = Vector.make({ ...this.config }, Object.freeze({
            indices: Object.freeze(this.indices),
            values: Object.freeze(this.values),
            nullCount: this.nullCount,
        }), this.childConfig);

        // @ts-expect-error
        this.values = [];
        // @ts-expect-error
        this.indices = [];
        this.currentIndex = 0;
        return vector;
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
    /** Preallocate this many items */
    length?: number;
    valueFrom?: ValueFromFn<T>;
    /**
     * The type config for any nested fields (currently only works for objects)
    */
    childConfig?: DataTypeFields;
}
