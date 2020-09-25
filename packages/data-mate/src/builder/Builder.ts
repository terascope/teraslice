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

        const min = Math.min(vector.size, length);
        for (let i = 0; i < min; i++) {
            builder.values[i] = vector.get(i) as Maybe<R>;
        }
        builder.currentIndex = vector.size;
        return builder;
    }

    readonly childConfig?: DataTypeFields;
    readonly values: Maybe<T>[];
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
        this.values = length != null ? Array(length) : [];
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
            this.values[index] = null;
        } else {
            this.values[index] = (
                this.valueFrom ? this.valueFrom(value, this) : value
            ) as T;
        }
        return this;
    }

    /** Append a value to the end */
    append(value: unknown): Builder<T> {
        return this.set(this.currentIndex++, value);
    }

    /**
     * Flush and convert the result to a Vector
    */
    toVector(): Vector<T> {
        const vector = Vector.make({ ...this.config }, Object.freeze({
            values: Object.freeze(this.values)
        }), this.childConfig);

        // @ts-expect-error
        this.values = [];
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
