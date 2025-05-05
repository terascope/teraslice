import { DataTypeFieldConfig, DataTypeFields, Maybe } from '@terascope/types';
import { TSError, toString, getTypeOf } from '@terascope/utils';
import { freezeObject, ReadableData, WritableData } from '../core/index.js';
import { ListVector, Vector, VectorType } from '../vector/index.js';

/**
 * Since Vectors are immutable, a Builder can be used to construct a
 * Vector. When values are inserted they are coerced and validated.
*/
export abstract class Builder<T = unknown> {
    /**
     * Make an instance of a Builder from a DataTypeFieldConfig
    */
    static make<R = unknown>(
        data: WritableData<R>,
        options: BuilderOptions,
    ): Builder<R> {
        throw new Error(
            `This functionality will be replaced in the index file
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
        const data = vector.toWritable(size);
        const builder = Builder.make<R>(
            data,
            {
                childConfig: vector.childConfig,
                config: vector.config,
                name: vector.name,
            },
        );
        builder.currentIndex = vector.size;
        return builder;
    }

    /**
     * The type of Vector, this should only be set with the specific Vector type classes.
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
     * Used for optimizations to noop certain functions and save memory where possible
    */
    private isEmpty = true;

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
        this.childConfig = options.childConfig
            ? freezeObject(options.childConfig)
            : undefined;
        this.data = data;
        this.currentIndex = 0;
    }

    /**
     * Convert a value to the internal in-memory storage format for the Vector
    */
    abstract _valueFrom(value: unknown): T;

    /**
     * Convert a value to the internal in-memory storage format for the Vector
    */
    valueFrom(
        value: unknown,
        indices?: number | Iterable<number>,
    ): T {
        try {
            return this._valueFrom(value);
        } catch (err) {
            this._throwValueFromError(err, value, indices);
        }
    }

    private _throwValueFromError(
        _err: unknown,
        value: unknown,
        indices?: number | Iterable<number>,
    ): never {
        let err = _err as any;
        if (typeof err?.message !== 'string') {
            err = new TSError(err);
        }
        if (err._added_value_from_context) throw err;

        const colInfo = `field: ${this.name || '<undefined>'}[${indices ?? 0}]`;
        const valInfo = `value: ${toString(value)}, type_of_value: ${getTypeOf(value)})`;
        const dataTypeInfo = `field_config: ${toString(this.config)}`;
        err.message += `; _debug_(${[colInfo, valInfo, dataTypeInfo].join(', ')})`;
        Object.defineProperty(err, '_added_value_from_context', {
            enumerable: false,
            value: true
        });
        throw err;
    }

    /**
     * Set value by index
    */
    set(index: number, value: unknown): this {
        const data = this.valueFrom(value, index);
        this.data.set(index, data);
        return this;
    }

    /**
     * Set a single unique value on multiple indices
    */
    mset(value: unknown, indices: Iterable<number>): this {
        const val = this.valueFrom(value, indices);
        for (const index of indices) {
            this.data.set(index, val);
        }
        return this;
    }

    /**
     * Append a value to the end
    */
    append(value: unknown): this {
        return this.set(this.currentIndex++, value);
    }

    /**
     * Resize the amount of records stored in in the
     * writable data structure
    */
    resize(size: number): this {
        const data = this.data.resize(size);
        // @ts-expect-error (since this is read only)
        this.data = data;
        return this;
    }

    /**
     * Flush and convert the result to a Vector
    */
    toVector(): Vector<T> {
        const vector = Vector.make(
            [new ReadableData(this.data)],
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
    config: DataTypeFieldConfig | Readonly<DataTypeFieldConfig>;

    /**
     * The name of field, if specified this will just be used for metadata
    */
    name?: string;
}

/**
 * Copy the values from a Vector to a Builder
*/
export function copyVectorToBuilder<T, R>(
    vector: Vector<T> | ListVector<T>,
    builder: Builder<R>,
): Vector<R> {
    for (const [i, v] of vector.values()) {
        builder.set(i, v);
    }
    return builder.toVector();
}

/**
 * Copy the values from a Vector to a Builder
*/
export function transformVectorToBuilder<T, R>(
    vector: Vector<T> | ListVector<T>,
    builder: Builder<R>,
    transform: (value: T | readonly Maybe<T>[], index: number) => Maybe<R> | readonly Maybe<R>[],
): Vector<R> {
    for (const [i, v] of vector.values()) {
        builder.set(i, transform(v, i));
    }
    return builder.toVector();
}
