import { DataTypeFieldConfig, DataTypeFields, Maybe } from '@terascope/types';
import {
    Vector, VectorType
} from '../vector';

/**
 * A Vector builder
*/
export abstract class Builder<T = unknown> {
    readonly type: VectorType;
    readonly config: DataTypeFieldConfig;
    readonly valueFrom?: ValueFromFn<T>;

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

    readonly childConfig?: DataTypeFields;
    protected readonly _values: Maybe<T>[];
    protected _currentIndex = 0;

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
        this._values = length != null ? Array(length) : [];
    }

    /**
     * Returns the number items in the Builder
    */
    get size(): number {
        return this._values.length;
    }

    /**
     * Set value by index
    */
    set(index: number, value: unknown): Builder<T> {
        if (value == null) {
            this._values[index] = null;
        } else {
            this._values[index] = (
                this.valueFrom ? this.valueFrom(value, this) : value
            ) as T;
        }
        return this;
    }

    /** Append a value to the end */
    append(value: unknown): Builder<T> {
        return this.set(this._currentIndex++, value);
    }

    /**
     * Flush and convert the result to a Vector
    */
    toVector(): Vector<T> {
        const vector = Vector.make(this.config, Object.freeze({
            values: Object.freeze(this._values.slice())
        }), this.childConfig);

        // clear
        this._values.length = 0;
        this._currentIndex = 0;

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
