import { DataTypeFieldConfig, DataTypeFields, Maybe } from '@terascope/types';
import {
    freezeObject, ReadableData, WritableData, TypedArray
} from '../core';
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
        data: WritableData<R>,
        options: BuilderOptions,
    ): Builder<R> {
        throw new Error(
            `This will functionality replaced in the index file
            ${options} ${length} ${data}`
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
            data,
            {
                childConfig: vector.childConfig,
                config: vector.config,
                name: vector.name,
            },
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
    readonly config: Readonly<DataTypeFieldConfig>;

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
     * The name of field, if specified this will just be used for metadata
    */
    readonly name?: string;

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
        options: BuilderOptions,
    ) {
        this.name = options.name;
        this.type = type;
        this.config = freezeObject(options.config);
        this.childConfig = options.childConfig ? freezeObject(options.childConfig) : undefined;
        this.data = data;
        this.currentIndex = 0;
    }

    /**
     * A function for converting a value to an JSON spec compatible format.
     * This is specific on the vector type classes via a static method usually.
    */
    abstract valueFrom(value: unknown): T;

    /**
     * Print a better error message
    */
    private _valueFromWithError(
        indices: number|readonly number[]|TypedArray,
        value: unknown
    ): T {
        try {
            return this.valueFrom(value);
        } catch (err) {
            if (typeof err?.message === 'string') {
                err.message += `; column: "${this.name}", row: ${indices}`;
            }
            throw err;
        }
    }

    /**
     * Set value by index
    */
    set(index: number, value: unknown): Builder<T> {
        if (value == null) return this;

        this.data.set(index, this._valueFromWithError(index, value));
        return this;
    }

    /**
     * Set a single unique value on multiple indices
    */
    mset(value: unknown, indices: readonly number[]|TypedArray): Builder<T> {
        if (value == null) return this;

        this.data.mset(this._valueFromWithError(indices, value), indices);
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
            new ReadableData(this.data),
            {
                childConfig: this.childConfig,
                config: this.config,
                name: this.name,
            }
        );

        this.data.reset();
        this.currentIndex = 0;
        return vector;
    }

    [Symbol.for('nodejs.util.inspect.custom')](): any {
        const proxy = {
            name: this.name,
            type: this.type,
            config: this.config,
            childConfig: this.childConfig,
            size: this.data.size,
            currentIndex: this.currentIndex,
            values: this.data.values
        };

        // Trick so that node displays the name of the constructor
        Object.defineProperty(proxy, 'constructor', {
            value: this.constructor,
            enumerable: false
        });

        return proxy;
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
export type ValueFromFn<T> = (value: unknown) => T;

/**
 * A list of Builder Options
 */
export interface BuilderOptions {
    /**
     * The type config for any nested fields (currently only works for objects)
    */
    childConfig?: DataTypeFields;

    /**
     * The field config
    */
    config: DataTypeFieldConfig|Readonly<DataTypeFieldConfig>;

    /**
     * The name of field, if specified this will just be used for metadata
    */
    name?: string;
}

/**
 * Copy the values from a Vector to a Builder
*/
export function copyVectorToBuilder<T, R>(
    vector: Vector<T>,
    builder: Builder<R>,
): Vector<R> {
    for (const value of vector.data.values) {
        builder.mset(value.v, value.i);
    }
    return builder.toVector();
}

/**
 * Copy the values from a Vector to a Builder
*/
export function transformVectorToBuilder<T, R>(
    vector: Vector<T>,
    builder: Builder<R>,
    transform: (value: T) => Maybe<R>,
): Vector<R> {
    for (const value of vector.data.values) {
        builder.mset(transform(value.v), value.i);
    }
    return builder.toVector();
}
