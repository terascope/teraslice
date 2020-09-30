import { DataTypeFieldConfig, DataTypeFields } from '@terascope/types';
import { getHashCodeFrom } from '../core-utils';
import {
    DataValueTuple,
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
        length: number,
    ): Builder<R> {
        if (length == null) {
            throw new Error('Builder.makeFromVector requires a length');
        }
        // FIXME handle when length is less than the Vector size

        const builder = Builder.make<R>(
            vector.config,
            length,
            vector.childConfig
        );

        for (const val of vector) {
            builder.append(val);
        }
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
    readonly valueFrom: ValueFromFn<T>;

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
    readonly indices: (string|null)[];

    /**
     * When value is not a primitive, we need a way to look up the index by the hash code
     * @internal
    */
    readonly values = new Map<string|null, DataValueTuple<T>>();

    /**
     * The current insertion index (used for append)
    */
    currentIndex = 0;

    /**
     * This changes the behavior in how the unique values are calculated
    */
    abstract isPrimitive: boolean;

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
        this.valueFrom = wrapValueFrom(valueFrom);
        this.childConfig = childConfig ? { ...childConfig } : undefined;
        this.indices = length != null ? Array(length) : [];
        this.values = new Map();
    }

    /**
     * Returns the number items in the Builder
    */
    get size(): number {
        return this.indices.length;
    }

    /**
     * Set value by index
    */
    set(index: number, value: unknown): Builder<T> {
        const val = value == null ? null : this.valueFrom(value, this);
        const hash = getHashCodeFrom(val, !this.isPrimitive);

        this.indices[index] = hash;

        const [count, storedVal] = this.values.get(hash) ?? [1, val];
        this.values.set(hash, [count + 1, storedVal]);
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
            values: this.values as ReadonlyMap<string|null, DataValueTuple<T>>,
        }), this.childConfig);

        // @ts-expect-error
        this.values = new Map();
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

function wrapValueFrom<T>(valueFrom?: ValueFromFn<T>): ValueFromFn<T> {
    if (valueFrom == null) return (value) => value as T;
    return valueFrom;
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
